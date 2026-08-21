namespace TornaguiaAsistente.Application.Solicitudes;

public interface ICasoUsoObtenerPdfTornaguia
{
    Task<byte[]> EjecutarAsync(int solicitudId, int usuarioId);
}
