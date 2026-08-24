using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Solicitudes;
using TornaguiaAsistente.Infrastructure.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Solicitudes;

public class CasoUsoObtenerHistorialSolicitudes : ICasoUsoObtenerHistorialSolicitudes
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoObtenerHistorialSolicitudes(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<HistorialSolicitudResponse>> EjecutarAsync(int usuarioId)
    {
        var filas = await _context.Solicitudes
            .Where(s => s.UsuarioId == usuarioId)
            .OrderByDescending(s => s.FechaSolicitud)
            .Select(s => new
            {
                s.Id,
                TipoTornaguia = s.TipoTornaguia.Nombre,
                MunicipioOrigenNombre = s.MunicipioOrigen.Nombre,
                MunicipioDestinoNombre = s.MunicipioDestino != null ? s.MunicipioDestino.Nombre : null,
                PaisDestinoNombre = s.PaisDestino != null ? s.PaisDestino.Nombre : null,
                s.EstaDeclarado,
                s.EsParaExportacion,
                s.FechaSolicitud,
                TieneDetalleGenerado = s.DetalleTornaguia != null,
                TienePdf = s.DetalleTornaguia != null && s.DetalleTornaguia.PdfBytes != null,
                s.LoteId,
            })
            .ToListAsync();

        return filas
            .Select(f => new HistorialSolicitudResponse(
                f.Id,
                f.TipoTornaguia,
                f.MunicipioOrigenNombre,
                f.MunicipioDestinoNombre,
                f.PaisDestinoNombre,
                f.EstaDeclarado,
                f.EsParaExportacion,
                f.FechaSolicitud,
                f.TieneDetalleGenerado,
                f.TienePdf,
                f.LoteId.HasValue ? InventarioAjustes.NumeroSerie(f.LoteId.Value) : null))
            .ToList();
    }
}
