namespace TornaguiaAsistente.Domain.Entities;

public class ExcepcionTransitoLocal
{
    public int Id { get; set; }
    public string Descripcion { get; set; } = string.Empty;

    public int DepartamentoId { get; set; }
    public Departamento Departamento { get; set; } = null!;

    public int? ProductoId { get; set; }
    public Producto? Producto { get; set; }
}