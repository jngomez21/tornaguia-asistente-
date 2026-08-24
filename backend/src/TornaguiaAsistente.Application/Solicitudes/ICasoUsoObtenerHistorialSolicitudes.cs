namespace TornaguiaAsistente.Application.Solicitudes;

public interface ICasoUsoObtenerHistorialSolicitudes
{
    Task<IReadOnlyList<HistorialSolicitudResponse>> EjecutarAsync(int usuarioId);
}

public record HistorialSolicitudResponse(
    int SolicitudId,
    string TipoTornaguia,
    string MunicipioOrigenNombre,
    string? MunicipioDestinoNombre,
    string? PaisDestinoNombre,
    bool EstaDeclarado,
    bool EsParaExportacion,
    DateTime FechaSolicitud,
    bool TieneDetalleGenerado,
    bool TienePdf,
    string? LoteNumeroSerie
);
