namespace TornaguiaAsistente.Application.Bodegas;

public interface ICasoUsoCrearBodega
{
    Task<BodegaResponse> EjecutarAsync(CrearBodegaRequest request);
}

public record CrearBodegaRequest(
    int UsuarioId,
    string Nombre,
    int MunicipioId,
    string? DireccionEspecifica = null,
    double? DireccionLatitud = null,
    double? DireccionLongitud = null);
