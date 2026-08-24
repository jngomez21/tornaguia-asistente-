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
        var detalle = await SolicitudesAjustes.ObtenerDetalleConSolicitudAsync(_context, solicitudId, usuarioId);

        if (detalle.PdfBytes is null)
            throw new SolicitudInvalidaException("El PDF de esta tornaguía aún no se ha generado.");

        return detalle.PdfBytes;
    }
}
