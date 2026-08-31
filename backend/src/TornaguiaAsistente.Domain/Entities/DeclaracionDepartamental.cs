namespace TornaguiaAsistente.Domain.Entities;

public class DeclaracionDepartamental
{
    public int Id { get; set; }

    public string NumeroDeclaracion { get; set; } = string.Empty;

    public int DepartamentoId { get; set; }
    public Departamento Departamento { get; set; } = null!;

    public string Periodo { get; set; } = string.Empty;

    public string RemitenteNombre { get; set; } = string.Empty;
    public string RemitenteIdentificacion { get; set; } = string.Empty;

    public byte[] DocumentoBytes { get; set; } = [];
    public string DocumentoNombreArchivo { get; set; } = string.Empty;
    public string DocumentoContentType { get; set; } = string.Empty;

    public DateTime FechaCarga { get; set; }

    public Lote? Lote { get; set; }
}
