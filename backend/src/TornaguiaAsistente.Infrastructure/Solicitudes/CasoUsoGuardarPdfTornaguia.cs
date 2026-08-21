using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Solicitudes;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Solicitudes;

public class CasoUsoGuardarPdfTornaguia : ICasoUsoGuardarPdfTornaguia
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoGuardarPdfTornaguia(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task EjecutarAsync(GuardarPdfTornaguiaRequest request)
    {
        var detalle = await _context.SolicitudesDetalleTornaguia
            .Include(d => d.Solicitud)
            .FirstOrDefaultAsync(d => d.SolicitudId == request.SolicitudId)
            ?? throw new SolicitudInvalidaException(
                $"La solicitud {request.SolicitudId} no tiene un detalle de tornaguía generado.");

        if (detalle.Solicitud.UsuarioId != request.UsuarioId)
            throw new SolicitudInvalidaException("La solicitud no pertenece al usuario autenticado.");

        detalle.PdfBytes = request.PdfBytes;
        await _context.SaveChangesAsync();
    }
}
