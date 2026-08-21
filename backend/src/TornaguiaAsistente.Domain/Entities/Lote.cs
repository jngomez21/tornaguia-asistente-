namespace TornaguiaAsistente.Domain.Entities;

public class Lote
{
    public int Id { get; set; }

    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    public EstadoLote Estado { get; set; }
    public DateTime FechaCreacion { get; set; }

    public ICollection<LoteProducto> LoteProductos { get; set; } = new List<LoteProducto>();
    public Solicitud? Solicitud { get; set; }
}
