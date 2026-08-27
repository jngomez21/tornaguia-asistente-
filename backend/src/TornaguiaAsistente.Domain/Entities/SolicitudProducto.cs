namespace TornaguiaAsistente.Domain.Entities;

public class SolicitudProducto
{
    public int Id { get; set; }

    public int SolicitudId { get; set; }
    public Solicitud Solicitud { get; set; } = null!;

    public int ProductoId { get; set; }
    public Producto Producto { get; set; } = null!;

    public decimal Cantidad { get; set; }
}