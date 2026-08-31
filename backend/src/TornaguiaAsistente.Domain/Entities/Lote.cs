namespace TornaguiaAsistente.Domain.Entities;

public class Lote
{
    public int Id { get; set; }

    public int? BodegaId { get; set; }
    public Bodega? Bodega { get; set; }

    public EstadoLote Estado { get; set; }
    public DateTime FechaCreacion { get; set; }

    public int? DeclaracionDepartamentalId { get; set; }
    public DeclaracionDepartamental? DeclaracionDepartamental { get; set; }

    public ICollection<LoteProducto> LoteProductos { get; set; } = new List<LoteProducto>();
    public Solicitud? Solicitud { get; set; }
}
