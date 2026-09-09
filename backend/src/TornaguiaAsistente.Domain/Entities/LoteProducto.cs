namespace TornaguiaAsistente.Domain.Entities;

public class LoteProducto
{
    public int Id { get; set; }

    public int LoteId { get; set; }
    public Lote Lote { get; set; } = null!;

    public int ProductoId { get; set; }
    public Producto Producto { get; set; } = null!;

    public decimal Cantidad { get; set; }

    /// <summary>
    /// Valor total (no unitario) de impuesto al consumo para esta linea del lote: si el lote
    /// viene de una declaracion departamental, es el valor ya causado segun ese documento; si
    /// no, es el valor que el sistema asigna por defecto (ver <see cref="Domain.Impuestos.ImpuestoConsumo"/>).
    /// </summary>
    public decimal ValorImpuestoConsumo { get; set; }
}
