namespace TornaguiaAsistente.Domain.Entities;

public class Municipio
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;

    public int DepartamentoId { get; set; }
    public Departamento Departamento { get; set; } = null!;
}