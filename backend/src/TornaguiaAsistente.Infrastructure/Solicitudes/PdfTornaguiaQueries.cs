using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Solicitudes;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Solicitudes;

/// <summary>usuarioId = null → cualquier solicitud, sin verificar dueño (gerencial); con valor →
/// debe pertenecerle (contribuyente, mismo comportamiento de siempre).</summary>
internal static class PdfTornaguiaQueries
{
    public static async Task<byte[]> ObtenerPdfAsync(TornaguiaDbContext ctx, int solicitudId, int? usuarioId)
    {
        var detalle = await ctx.SolicitudesDetalleTornaguia
            .Include(d => d.Solicitud)
            .FirstOrDefaultAsync(d => d.SolicitudId == solicitudId)
            ?? throw new SolicitudInvalidaException($"La solicitud {solicitudId} no tiene un detalle de tornaguía generado.");

        if (usuarioId is not null)
            SolicitudesAjustes.AsegurarPropietario(detalle.Solicitud.UsuarioId, usuarioId.Value, "La solicitud");

        if (detalle.PdfBytes is null)
            throw new SolicitudInvalidaException("El PDF de esta tornaguía aún no se ha generado.");

        return detalle.PdfBytes;
    }
}
