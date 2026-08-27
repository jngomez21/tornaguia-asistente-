namespace TornaguiaAsistente.Application.Solicitudes;

public interface ICasoUsoGuardarDetalleTornaguia
{
    Task<DetalleTornaguiaResponse> EjecutarAsync(GuardarDetalleTornaguiaRequest request);
}

public record GuardarDetalleTornaguiaRequest(
    int SolicitudId,
    int UsuarioId,
    string RemitenteNombre,
    string RemitenteIdentificacion,
    string DestinatarioNombre,
    string DestinatarioIdentificacion,
    string TransportadorNombre,
    string TransportadorIdentificacion,
    string PlacaVehiculo,
    int LoteId
);

public record DetalleTornaguiaResponse(
    int SolicitudId,
    string RemitenteNombre,
    string RemitenteIdentificacion,
    string DestinatarioNombre,
    string DestinatarioIdentificacion,
    string TransportadorNombre,
    string TransportadorIdentificacion,
    string PlacaVehiculo,
    DateTime FechaGeneracion,
    IReadOnlyList<ProductoTransportadoResponse> Productos
);

public record ProductoTransportadoResponse(string ProductoCodigo, string ProductoNombre, decimal Cantidad, decimal Capacidad);
