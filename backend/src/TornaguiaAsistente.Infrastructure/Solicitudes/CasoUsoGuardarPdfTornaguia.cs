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
        var detalle = await SolicitudesAjustes.ObtenerDetalleConSolicitudAsync(
            _context, request.SolicitudId, request.UsuarioId);

        detalle.PdfBytes = request.PdfBytes;
        await _context.SaveChangesAsync();
    }
}
