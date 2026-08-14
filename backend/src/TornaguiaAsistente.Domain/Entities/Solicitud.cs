namespace TornaguiaAsistente.Domain.Entities;

public class Solicitud
{
    public int Id { get; set; }

    public int TipoTornaguiaId { get; set; }
    public TipoTornaguia TipoTornaguia { get; set; } = null!;

    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    public int MunicipioOrigenId { get; set; }
    public Municipio MunicipioOrigen { get; set; } = null!;

    public int? MunicipioDestinoId { get; set; }
    public Municipio? MunicipioDestino { get; set; }

    public int? PaisDestinoId { get; set; }
    public Pais? PaisDestino { get; set; }

    public bool EstaDeclarado { get; set; }
    public bool EsParaExportacion { get; set; }
    public string? NumeroDeclaracionOrigen { get; set; }


    public DateTime FechaSolicitud { get; set; }

    public ICollection<SolicitudProducto> SolicitudProductos { get; set; } = new List<SolicitudProducto>();
}