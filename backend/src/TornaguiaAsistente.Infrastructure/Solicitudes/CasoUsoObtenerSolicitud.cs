using System.Text.Json;
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
            .Include(s => s.BodegaOrigen)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == solicitudId)
            ?? throw new SolicitudInvalidaException($"Solicitud {solicitudId} no encontrada.");

        SolicitudesAjustes.AsegurarPropietario(solicitud.UsuarioId, usuarioId, "La solicitud");

        IReadOnlyList<double[]>? geometria = null;
        IReadOnlyList<int>? departamentosIntermedioIds = null;
        if (solicitud.MunicipioDestinoId is not null)
        {
            var rutaCacheada = await _context.RutasCalculadas
                .AsNoTracking()
                .FirstOrDefaultAsync(r =>
                    r.MunicipioOrigenId == solicitud.MunicipioOrigenId &&
                    r.MunicipioDestinoId == solicitud.MunicipioDestinoId.Value);

            geometria = rutaCacheada?.Geometria?.Coordinates
                .Select(c => new[] { c.X, c.Y })
                .ToList();

            if (rutaCacheada is not null)
            {
                departamentosIntermedioIds = JsonSerializer.Deserialize<List<int>>(rutaCacheada.DepartamentosIntermedios);
            }
        }

        return new CrearSolicitudResponse(
            SolicitudId: solicitud.Id,
            TipoTornaguia: solicitud.TipoTornaguia.Nombre,
            Justificacion: solicitud.Justificacion,
            DistanciaKm: solicitud.DistanciaKm,
            TiempoEstimadoMinutos: solicitud.TiempoEstimadoMinutos,
            DepartamentosIntermedios: solicitud.DepartamentosIntermedios,
            Geometria: geometria,
            DepartamentosIntermedioIds: departamentosIntermedioIds,
            OrigenDireccionEspecifica: solicitud.BodegaOrigen?.DireccionEspecifica);
    }
}
