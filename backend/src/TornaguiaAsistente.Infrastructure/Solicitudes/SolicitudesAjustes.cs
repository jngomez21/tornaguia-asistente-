using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Solicitudes;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Solicitudes;

internal static class SolicitudesAjustes
{
    public static void AsegurarPropietario(int propietarioReal, int usuarioId, string entidad)
    {
        if (propietarioReal != usuarioId)
            throw new SolicitudInvalidaException($"{entidad} no pertenece al usuario autenticado.");
    }

    public static async Task<SolicitudDetalleTornaguia> ObtenerDetalleConSolicitudAsync(
        TornaguiaDbContext context, int solicitudId, int usuarioId)
    {
        var detalle = await context.SolicitudesDetalleTornaguia
            .Include(d => d.Solicitud)
            .FirstOrDefaultAsync(d => d.SolicitudId == solicitudId)
            ?? throw new SolicitudInvalidaException(
                $"La solicitud {solicitudId} no tiene un detalle de tornaguía generado.");

        AsegurarPropietario(detalle.Solicitud.UsuarioId, usuarioId, "La solicitud");

        return detalle;
    }
}
