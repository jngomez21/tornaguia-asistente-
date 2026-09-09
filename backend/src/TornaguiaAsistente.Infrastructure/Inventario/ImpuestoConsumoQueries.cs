using Microsoft.EntityFrameworkCore;
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
        var query = ctx.SolicitudesProductos.Where(sp =>
            esReenvio ? sp.Solicitud.TipoTornaguia.Nombre == TipoReenvio : sp.Solicitud.TipoTornaguia.Nombre != TipoReenvio);

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
