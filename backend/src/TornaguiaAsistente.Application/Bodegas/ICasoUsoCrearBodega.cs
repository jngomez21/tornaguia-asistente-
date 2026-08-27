namespace TornaguiaAsistente.Application.Bodegas;

public interface ICasoUsoCrearBodega
{
    Task<BodegaResponse> EjecutarAsync(CrearBodegaRequest request);
}

public record CrearBodegaRequest(int UsuarioId, string Nombre, int MunicipioId);
