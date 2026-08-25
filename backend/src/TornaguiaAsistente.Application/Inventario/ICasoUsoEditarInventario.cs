namespace TornaguiaAsistente.Application.Inventario;

public interface ICasoUsoEditarInventario
{
    Task<InventarioItemResponse> EjecutarAsync(EditarInventarioRequest request);
}

public record EditarInventarioRequest(int UsuarioId, int ProductoId, decimal CantidadDisponible);
