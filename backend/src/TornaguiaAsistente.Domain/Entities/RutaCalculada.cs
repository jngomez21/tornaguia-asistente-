namespace TornaguiaAsistente.Domain.Entities;

public class RutaCalculada
{
    public int Id { get; set; }
    
    public int MunicipioOrigenId { get; set; }
    public Municipio MunicipioOrigen { get; set; } = null!;

    public int MunicipioDestinoId { get; set; }
    public Municipio MunicipioDestino { get; set; } = null!;

    public string DepartamentosIntermedios { get; set; } = string.Empty;
    public decimal DistanciaKm { get; set; }
    public int TiempoEstimadoMinutos { get; set; }
    public DateTime FechaConsulta { get; set; }
}