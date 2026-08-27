namespace TornaguiaAsistente.Domain.Entities;

public class Bodega
{
    public int Id { get; set; }

    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    public int MunicipioId { get; set; }
    public Municipio Municipio { get; set; } = null!;

    public string Nombre { get; set; } = string.Empty;

    public ICollection<InventarioProducto> InventarioProductos { get; set; } = new List<InventarioProducto>();
    public ICollection<EntradaInventario> EntradasInventario { get; set; } = new List<EntradaInventario>();
    public ICollection<Lote> Lotes { get; set; } = new List<Lote>();
}
