namespace TornaguiaAsistente.Domain.Entities;

public class Departamento
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;

    public ICollection<Municipio> Municipios {get; set;} = new List<Municipio>();
}