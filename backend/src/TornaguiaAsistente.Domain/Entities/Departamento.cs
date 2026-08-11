using NetTopologySuite.Geometries;

namespace TornaguiaAsistente.Domain.Entities;

public class Departamento
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string CodigoDane { get; set;} = string.Empty;
    
    public MultiPolygon? Limites { get; set; }

    public ICollection<Municipio> Municipios {get; set;} = new List<Municipio>();
}