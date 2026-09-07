namespace TornaguiaAsistente.Domain.Entities;

public class MensajeAsistente
{
    public int Id { get; set; }

    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    public Guid ConversacionId { get; set; }

    public string Rol { get; set; } = null!;
    public string Contenido { get; set; } = null!;
    public DateTime FechaCreacion { get; set; }
}
