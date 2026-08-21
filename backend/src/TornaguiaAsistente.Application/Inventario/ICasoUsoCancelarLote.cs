namespace TornaguiaAsistente.Application.Inventario;

public interface ICasoUsoCancelarLote
{
    Task EjecutarAsync(CancelarLoteRequest request);
}

public record CancelarLoteRequest(int LoteId, int UsuarioId);
