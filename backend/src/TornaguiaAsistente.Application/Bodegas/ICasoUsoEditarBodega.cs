namespace TornaguiaAsistente.Application.Bodegas;

public interface ICasoUsoEditarBodega
{
    Task<BodegaResponse> EjecutarAsync(EditarBodegaRequest request);
}

public record EditarBodegaRequest(
    int BodegaId,
    int UsuarioId,
    string Nombre,
    int MunicipioId,
    string? DireccionEspecifica = null,
    double? DireccionLatitud = null,
    double? DireccionLongitud = null);
