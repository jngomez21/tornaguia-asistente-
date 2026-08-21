namespace TornaguiaAsistente.Application.Inventario;

public interface ICasoUsoEditarLote
{
    Task<LoteResponse> EjecutarAsync(EditarLoteRequest request);
}

public record EditarLoteRequest(int LoteId, int UsuarioId, IReadOnlyList<LoteProductoRequest> Productos);
