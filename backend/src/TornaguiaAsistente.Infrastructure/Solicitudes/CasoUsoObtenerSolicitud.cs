using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Solicitudes;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Solicitudes;

public class CasoUsoObtenerSolicitud : ICasoUsoObtenerSolicitud
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoObtenerSolicitud(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<CrearSolicitudResponse> EjecutarAsync(int solicitudId, int usuarioId)
    {
        var solicitud = await _context.Solicitudes
            .Include(s => s.TipoTornaguia)
            .FirstOrDefaultAsync(s => s.Id == solicitudId)
            ?? throw new SolicitudInvalidaException($"Solicitud {solicitudId} no encontrada.");

        if (solicitud.UsuarioId != usuarioId)
            throw new SolicitudInvalidaException("La solicitud no pertenece al usuario autenticado.");

        return new CrearSolicitudResponse(
            SolicitudId: solicitud.Id,
            TipoTornaguia: solicitud.TipoTornaguia.Nombre,
            Justificacion: solicitud.Justificacion,
            DistanciaKm: solicitud.DistanciaKm,
            TiempoEstimadoMinutos: solicitud.TiempoEstimadoMinutos,
            DepartamentosIntermedios: solicitud.DepartamentosIntermedios);
    }
}
