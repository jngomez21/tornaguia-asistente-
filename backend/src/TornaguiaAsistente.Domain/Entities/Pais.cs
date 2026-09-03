using NetTopologySuite.Geometries;

namespace TornaguiaAsistente.Domain.Entities;

public class Pais
{
    public int Id { get; set; }
    public string Nombre { get; set; } =string.Empty;
    public string CodigoISO { get; set; } = string.Empty;

    /// <summary>
    /// Paso fronterizo terrestre principal hacia Colombia (o, si no existe conexión por
    /// carretera, un punto de referencia cercano a la frontera). Usado por IMotorGeografico
    /// para calcular/mostrar una ruta hacia este país; nunca participa en IMotorReglas.
    /// </summary>
    public Point? PuntoReferencia { get; set; }
}
