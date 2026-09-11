using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Gerencial;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Inventario;

/// <summary>
/// Único lugar donde vive la regla de impuesto al consumo sin doble conteo: un lote Vinculado ya
/// aporta su valor vía SolicitudProducto (la solicitud que lo usó), así que solo se cuentan los
/// lotes en estado Reservado. "Reenvío" es el único tipo cuyo impuesto ya está causado (el
/// producto venía declarado); Movilización y Tránsito son impuesto por causar.
/// </summary>
internal static class ImpuestoConsumoQueries
{
    private const int OffsetHorasColombia = 5;
    private const string TipoReenvio = "Reenvío";

    // usuarioId = null  →  toda la base (gerencial)
    public static IQueryable<LoteProducto> LotesSinUsar(TornaguiaDbContext ctx, int? usuarioId) =>
        ctx.Lotes
            .Where(l => l.Estado == EstadoLote.Reservado && (usuarioId == null || l.Bodega!.UsuarioId == usuarioId))
            .SelectMany(l => l.LoteProductos);

    // usuarioId = null  →  toda la base (gerencial) · anio = null  →  histórico completo
    public static IQueryable<SolicitudProducto> Causado(TornaguiaDbContext ctx, int? usuarioId, int? anio) =>
        PorTipo(ctx, usuarioId, anio, esReenvio: true);

    public static IQueryable<SolicitudProducto> PorCausar(TornaguiaDbContext ctx, int? usuarioId, int? anio) =>
        PorTipo(ctx, usuarioId, anio, esReenvio: false);

    private static IQueryable<SolicitudProducto> PorTipo(TornaguiaDbContext ctx, int? usuarioId, int? anio, bool esReenvio)
    {
        // Ramificado en C#, no con un ternario dentro del Where: así EF traduce a "=" o "<>"
        // directo en vez de un CASE WHEN @esReenvio evaluado por fila en Postgres.
        var query = esReenvio
            ? ctx.SolicitudesProductos.Where(sp => sp.Solicitud.TipoTornaguia.Nombre == TipoReenvio)
            : ctx.SolicitudesProductos.Where(sp => sp.Solicitud.TipoTornaguia.Nombre != TipoReenvio);

        if (usuarioId is not null)
            query = query.Where(sp => sp.Solicitud.UsuarioId == usuarioId);

        if (anio is not null)
        {
            var (desde, hasta) = RangoAnioUtc(anio.Value);
            query = query.Where(sp => sp.Solicitud.FechaSolicitud >= desde && sp.Solicitud.FechaSolicitud < hasta);
        }

        return query;
    }

    /// <summary>
    /// A qué departamento le pertenece fiscalmente el impuesto de una línea: el de DESTINO (el
    /// consumidor final — en Movilización se causa allá, y en Reenvío la ley cruza ahí el impuesto
    /// ya pagado en origen), o el de origen cuando no hay destino colombiano (exportación). Único
    /// lugar donde vive esta regla — reutilizada tanto para agrupar (mapa) como para filtrar
    /// (FiltroDepartamentoProducto) por un departamento puntual (drill-down).
    /// </summary>
    public static Expression<Func<SolicitudProducto, int>> DepartamentoFiscalDeProducto { get; } =
        sp => sp.Solicitud.MunicipioDestino != null ? sp.Solicitud.MunicipioDestino.DepartamentoId : sp.Solicitud.MunicipioOrigen.DepartamentoId;

    // Cantidad (tráfico) siempre por origen; impuesto (fiscal) siempre por destino — ver
    // DepartamentoFiscalDeProducto. Los cuatro casos de uso que acotan por un departamento puntual
    // (Contribuyentes/TopProductos/TopRutas del drill-down, y ContarSolicitudes del bot) reutilizan
    // estas dos expresiones en vez de repetir el ternario.
    public static Expression<Func<Solicitud, bool>> FiltroDepartamento(int departamentoId, CriterioDepartamento criterio) =>
        criterio == CriterioDepartamento.Origen
            ? s => s.MunicipioOrigen.DepartamentoId == departamentoId
            : s => (s.MunicipioDestino != null ? s.MunicipioDestino.DepartamentoId : s.MunicipioOrigen.DepartamentoId) == departamentoId;

    public static Expression<Func<SolicitudProducto, bool>> FiltroDepartamentoProducto(int departamentoId, CriterioDepartamento criterio) =>
        criterio == CriterioDepartamento.Origen
            ? sp => sp.Solicitud.MunicipioOrigen.DepartamentoId == departamentoId
            : sp => (sp.Solicitud.MunicipioDestino != null ? sp.Solicitud.MunicipioDestino.DepartamentoId : sp.Solicitud.MunicipioOrigen.DepartamentoId) == departamentoId;

    public static IQueryable<Solicitud> FiltrarPorDepartamento(this IQueryable<Solicitud> query, int? departamentoId, CriterioDepartamento criterio) =>
        departamentoId is null ? query : query.Where(FiltroDepartamento(departamentoId.Value, criterio));

    public static IQueryable<SolicitudProducto> FiltrarPorDepartamento(this IQueryable<SolicitudProducto> query, int? departamentoId, CriterioDepartamento criterio) =>
        departamentoId is null ? query : query.Where(FiltroDepartamentoProducto(departamentoId.Value, criterio));

    /// <summary>
    /// Límites UTC (inicio inclusivo, fin exclusivo) de un año calendario en Colombia (UTC-5, sin
    /// horario de verano). FechaSolicitud se guarda en UTC, así que filtrar con `.Year == anio`
    /// desplazaría al año siguiente todo lo creado después de las 7pm del 31 de diciembre en Colombia.
    /// </summary>
    public static (DateTime Desde, DateTime Hasta) RangoAnioUtc(int anio)
    {
        var desde = new DateTime(anio, 1, 1, OffsetHorasColombia, 0, 0, DateTimeKind.Utc);
        var hasta = new DateTime(anio + 1, 1, 1, OffsetHorasColombia, 0, 0, DateTimeKind.Utc);
        return (desde, hasta);
    }
}
