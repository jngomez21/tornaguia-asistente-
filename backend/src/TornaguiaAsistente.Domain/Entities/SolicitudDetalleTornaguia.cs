namespace TornaguiaAsistente.Domain.Entities;

public class SolicitudDetalleTornaguia
{
    public int Id { get; set; }

    public int SolicitudId { get; set; }
    public Solicitud Solicitud { get; set; } = null!;

    public string RemitenteNombre { get; set; } = string.Empty;
    public string RemitenteIdentificacion { get; set; } = string.Empty;
    public string DestinatarioNombre { get; set; } = string.Empty;
    public string DestinatarioIdentificacion { get; set; } = string.Empty;
    public string TransportadorNombre { get; set; } = string.Empty;
    public string TransportadorIdentificacion { get; set; } = string.Empty;
    public string PlacaVehiculo { get; set; } = string.Empty;

    public DateTime FechaGeneracion { get; set; }
}
