namespace TornaguiaAsistente.Domain.Entities;

public class EntradaInventario
{
    public int Id { get; set; }

    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    public int ProductoId { get; set; }
    public Producto Producto { get; set; } = null!;

    public decimal Cantidad { get; set; }
    public DateTime Fecha { get; set; }
}
