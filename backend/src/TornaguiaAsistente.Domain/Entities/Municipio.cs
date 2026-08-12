using NetTopologySuite.Geometries;

namespace TornaguiaAsistente.Domain.Entities;

public class Municipio
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string CodigoDane { get; set;} = string.Empty;

    public int DepartamentoId { get; set; }
    public Departamento Departamento { get; set; } = null!;

    public Point? Ubicacion { get; set; }
}