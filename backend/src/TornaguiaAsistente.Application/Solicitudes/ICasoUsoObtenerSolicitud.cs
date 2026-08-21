namespace TornaguiaAsistente.Application.Solicitudes;

public interface ICasoUsoObtenerSolicitud
{
    Task<CrearSolicitudResponse> EjecutarAsync(int solicitudId, int usuarioId);
}
