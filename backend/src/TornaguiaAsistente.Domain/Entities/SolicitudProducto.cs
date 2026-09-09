namespace TornaguiaAsistente.Domain.Entities;

public class SolicitudProducto
{
    public int Id { get; set; }

    public int SolicitudId { get; set; }
    public Solicitud Solicitud { get; set; } = null!;

    public int ProductoId { get; set; }
    public Producto Producto { get; set; } = null!;

    public decimal Cantidad { get; set; }

    /// <summary>
    /// Copia congelada (snapshot) de LoteProducto.ValorImpuestoConsumo al momento de generar el
    /// detalle de la tornaguia, para que el valor no cambie si despues se edita el lote de origen.
    /// </summary>
    public decimal ValorImpuestoConsumo { get; set; }
}