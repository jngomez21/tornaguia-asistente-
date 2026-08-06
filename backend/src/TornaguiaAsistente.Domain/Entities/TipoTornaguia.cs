namespace TornaguiaAsistente.Domain.Entities;

public class TipoTornaguia
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;

    public ICollection<Solicitud> Solicitudes { get; set; } = new List<Solicitud>();
}