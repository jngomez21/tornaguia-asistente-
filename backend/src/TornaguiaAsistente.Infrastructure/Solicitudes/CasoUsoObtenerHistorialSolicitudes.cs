using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Solicitudes;
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
        return await _context.Solicitudes
            .Where(s => s.UsuarioId == usuarioId)
            .OrderByDescending(s => s.FechaSolicitud)
            .Select(s => new HistorialSolicitudResponse(
                s.Id,
                s.TipoTornaguia.Nombre,
                s.MunicipioOrigen.Nombre,
                s.MunicipioDestino != null ? s.MunicipioDestino.Nombre : null,
                s.PaisDestino != null ? s.PaisDestino.Nombre : null,
                s.EstaDeclarado,
                s.EsParaExportacion,
                s.FechaSolicitud,
                s.DetalleTornaguia != null,
                s.DetalleTornaguia != null && s.DetalleTornaguia.PdfBytes != null))
            .ToListAsync();
    }
}
