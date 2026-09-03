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

    public int? BodegaOrigenId { get; set; }
    public Bodega? BodegaOrigen { get; set; }

    public int? BodegaDestinoId { get; set; }
    public Bodega? BodegaDestino { get; set; }

    public int? PaisDestinoId { get; set; }
    public Pais? PaisDestino { get; set; }

    public bool EstaDeclarado { get; set; }
    public bool EsParaExportacion { get; set; }
    public string? NumeroDeclaracionOrigen { get; set; }

    public string Justificacion { get; set; } = string.Empty;
    public double? DistanciaKm { get; set; }
    public int? TiempoEstimadoMinutos { get; set; }
    public List<string>? DepartamentosIntermedios { get; set; }

    /// <summary>true cuando DistanciaKm es una distancia en línea recta (sin conexión terrestre real).</summary>
    public bool EsAproximada { get; set; }

    public DateTime FechaSolicitud { get; set; }

    public int? LoteId { get; set; }
    public Lote? Lote { get; set; }

    public ICollection<SolicitudProducto> SolicitudProductos { get; set; } = new List<SolicitudProducto>();
    public SolicitudDetalleTornaguia? DetalleTornaguia { get; set; }
}