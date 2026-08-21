namespace TornaguiaAsistente.Domain.Entities;

public class LoteProducto
{
    public int Id { get; set; }

    public int LoteId { get; set; }
    public Lote Lote { get; set; } = null!;

    public int ProductoId { get; set; }
    public Producto Producto { get; set; } = null!;

    public decimal Cantidad { get; set; }
}
