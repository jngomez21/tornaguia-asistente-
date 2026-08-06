namespace TornaguiaAsistente.Domain.Entities;

public class Usuario
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } =string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    public ICollection<Solicitud> Solicitudes { get; set; } = new List<Solicitud>();
}