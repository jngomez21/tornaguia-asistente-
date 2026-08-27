namespace TornaguiaAsistente.Domain.Entities;

public class EntradaInventario
{
    public int Id { get; set; }

    public int BodegaId { get; set; }
    public Bodega Bodega { get; set; } = null!;

    public int ProductoId { get; set; }
    public Producto Producto { get; set; } = null!;

    public decimal Cantidad { get; set; }
    public DateTime Fecha { get; set; }
}
