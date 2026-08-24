namespace TornaguiaAsistente.Application.Inventario;

public interface ICasoUsoDeshacerUltimaEntrada
{
    Task<InventarioItemResponse> EjecutarAsync(DeshacerUltimaEntradaRequest request);
}

public record DeshacerUltimaEntradaRequest(int UsuarioId, int ProductoId);
