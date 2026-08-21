namespace TornaguiaAsistente.Application.Inventario;

public interface ICasoUsoObtenerInventario
{
    Task<IReadOnlyList<InventarioItemResponse>> EjecutarAsync(int usuarioId);
}
