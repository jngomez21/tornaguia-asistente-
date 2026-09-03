using NetTopologySuite.Geometries;

namespace TornaguiaAsistente.Domain.Entities;

public class RutaCalculada
{
    public int Id { get; set; }

    public int MunicipioOrigenId { get; set; }
    public Municipio MunicipioOrigen { get; set; } = null!;

    /// <summary>Nulo cuando el destino cacheado es un país (ver PaisDestinoId) en vez de un municipio.</summary>
    public int? MunicipioDestinoId { get; set; }
    public Municipio? MunicipioDestino { get; set; }

    /// <summary>Nulo cuando el destino cacheado es un municipio (ver MunicipioDestinoId).</summary>
    public int? PaisDestinoId { get; set; }
    public Pais? PaisDestino { get; set; }

    public string DepartamentosIntermedios { get; set; } = string.Empty;
    public decimal DistanciaKm { get; set; }

    /// <summary>Nulo cuando EsAproximada es true: una línea recta no tiene un tiempo de viaje real.</summary>
    public int? TiempoEstimadoMinutos { get; set; }

    /// <summary>
    /// true cuando Mapbox no encontró una ruta terrestre entre origen y destino (ej. Panamá por
    /// el Tapón del Darién, o destinos sin conexión vial como Acandí) y Geometria es en cambio
    /// una línea recta de 2 puntos entre ambos, solo para referencia visual en el mapa.
    /// </summary>
    public bool EsAproximada { get; set; }

    public DateTime FechaConsulta { get; set; }

    /// <summary>Siempre poblada: real (Mapbox) o línea recta de 2 puntos cuando EsAproximada.</summary>
    public LineString Geometria { get; set; } = null!;
}
