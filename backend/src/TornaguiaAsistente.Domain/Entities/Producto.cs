namespace TornaguiaAsistente.Domain.Entities;

public class Producto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string CodigoUnico { get; set; } = string.Empty;
    public bool EsNacional { get; set; }
    public decimal Capacidad { get; set; }

    public ICollection<SolicitudProducto> SolicitudProductos { get; set; } = new List<SolicitudProducto>();
    public ICollection<ExcepcionTransitoLocal> ExcepcionesTransitoLocal { get; set; } = new List<ExcepcionTransitoLocal>();
}