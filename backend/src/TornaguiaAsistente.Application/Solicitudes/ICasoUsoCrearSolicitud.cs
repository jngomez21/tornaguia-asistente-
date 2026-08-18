namespace TornaguiaAsistente.Application.Solicitudes;

public interface ICasoUsoCrearSolicitud
{
    Task<CrearSolicitudResponse> EjecutarAsync(CrearSolicitudRequest request);
}

public record CrearSolicitudRequest(
    int UsuarioId,
    int MunicipioOrigenId,
    int? MunicipioDestinoId,
    int? PaisDestinoId,
    bool EstaDeclarado,
    bool EsParaExportacion
);

public record CrearSolicitudResponse(
    int SolicitudId,
    string TipoTornaguia,
    string Justificacion,
    double? DistanciaKm,
    int? TiempoEstimadoMinutos,
    IReadOnlyList<string>? DepartamentosIntermedios
);

public class SolicitudInvalidaException : Exception
{
    public SolicitudInvalidaException(string mensaje) : base(mensaje) {}
}