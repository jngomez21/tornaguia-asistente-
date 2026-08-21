using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Solicitudes;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Solicitudes;

public class CasoUsoObtenerPdfTornaguia : ICasoUsoObtenerPdfTornaguia
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoObtenerPdfTornaguia(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<byte[]> EjecutarAsync(int solicitudId, int usuarioId)
    {
        var detalle = await _context.SolicitudesDetalleTornaguia
            .Include(d => d.Solicitud)
            .FirstOrDefaultAsync(d => d.SolicitudId == solicitudId)
            ?? throw new SolicitudInvalidaException(
                $"La solicitud {solicitudId} no tiene un detalle de tornaguía generado.");

        if (detalle.Solicitud.UsuarioId != usuarioId)
            throw new SolicitudInvalidaException("La solicitud no pertenece al usuario autenticado.");

        if (detalle.PdfBytes is null)
            throw new SolicitudInvalidaException("El PDF de esta tornaguía aún no se ha generado.");

        return detalle.PdfBytes;
    }
}
