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

    public Task<byte[]> EjecutarAsync(int solicitudId, int usuarioId) =>
        PdfTornaguiaQueries.ObtenerPdfAsync(_context, solicitudId, usuarioId);

    public Task<byte[]> EjecutarSinVerificarDuenoAsync(int solicitudId) =>
        PdfTornaguiaQueries.ObtenerPdfAsync(_context, solicitudId, usuarioId: null);
}
