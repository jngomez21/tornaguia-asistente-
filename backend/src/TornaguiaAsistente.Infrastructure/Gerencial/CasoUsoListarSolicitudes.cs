using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Gerencial;
using TornaguiaAsistente.Infrastructure.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Gerencial;

public class CasoUsoListarSolicitudes : ICasoUsoListarSolicitudesGerencial
{
    private const int LimitePorDefecto = 20;
    private const int LimiteMaximo = 50;

    private readonly TornaguiaDbContext _context;

    public CasoUsoListarSolicitudes(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<SolicitudResumenGerencialResponse>> EjecutarAsync(ListarSolicitudesGerencialRequest request)
    {
        var query = _context.Solicitudes.AsQueryable();

        if (request.UsuarioId is not null)
            query = query.Where(s => s.UsuarioId == request.UsuarioId);
        if (request.Tipo is not null)
            query = query.Where(s => s.TipoTornaguia.Nombre == request.Tipo);
        if (request.DepartamentoId is not null)
            query = query.Where(s => s.MunicipioOrigen.DepartamentoId == request.DepartamentoId);
        if (request.Anio is not null)
        {
            var (desde, hasta) = ImpuestoConsumoQueries.RangoAnioUtc(request.Anio.Value);
            query = query.Where(s => s.FechaSolicitud >= desde && s.FechaSolicitud < hasta);
        }

        var limite = Math.Clamp(request.Limite <= 0 ? LimitePorDefecto : request.Limite, 1, LimiteMaximo);

        // Orden en SQL antes del Take: con "impuesto" se ordena por la suma correlacionada de
        // SolicitudProductos, no en memoria — el filtro ya pudo dejar miles de filas candidatas.
        var ordenado = request.OrdenarPor == "impuesto"
            ? query.OrderByDescending(s => s.SolicitudProductos.Sum(sp => (decimal?)sp.ValorImpuestoConsumo) ?? 0m)
            : query.OrderByDescending(s => s.FechaSolicitud);

        // Proyección a tipo anónimo primero: EF Core no traduce un Select que construya el record
        // final directamente cuando incluye un Sum() correlacionado (el mismo caso ya resuelto en
        // ObtenerTopProductos/ObtenerTopRutas).
        var proyectado = await ordenado
            .Take(limite)
            .Select(s => new
            {
                s.Id,
                s.FechaSolicitud,
                Tipo = s.TipoTornaguia.Nombre,
                Contribuyente = s.Usuario.Nombre,
                Origen = s.MunicipioOrigen.Nombre,
                Destino = s.MunicipioDestino != null ? s.MunicipioDestino.Nombre : (s.PaisDestino != null ? s.PaisDestino.Nombre : "—"),
                Impuesto = s.SolicitudProductos.Sum(sp => (decimal?)sp.ValorImpuestoConsumo) ?? 0m,
                // Misma condición exacta por la que PdfTornaguiaQueries lanza: así un true aquí
                // nunca puede convertirse en una descarga fallida.
                TienePdf = s.DetalleTornaguia != null && s.DetalleTornaguia.PdfBytes != null && s.DetalleTornaguia.PdfBytes.Length > 0,
            })
            .ToListAsync();

        return proyectado
            .Select(p => new SolicitudResumenGerencialResponse(p.Id, p.FechaSolicitud, p.Tipo, p.Contribuyente, p.Origen, p.Destino, p.Impuesto, p.TienePdf))
            .ToList();
    }
}
