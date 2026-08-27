namespace TornaguiaAsistente.Application.Inventario;

public interface ICasoUsoObtenerInventario
{
    Task<IReadOnlyList<InventarioItemResponse>> EjecutarAsync(int bodegaId, int usuarioId);
}
