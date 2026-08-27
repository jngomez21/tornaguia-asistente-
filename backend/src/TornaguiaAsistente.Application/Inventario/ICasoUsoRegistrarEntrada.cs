namespace TornaguiaAsistente.Application.Inventario;

public interface ICasoUsoRegistrarEntrada
{
    Task<InventarioItemResponse> EjecutarAsync(RegistrarEntradaRequest request);
}

public record RegistrarEntradaRequest(int BodegaId, int UsuarioId, int ProductoId, decimal Cantidad);

public record InventarioItemResponse(int ProductoId, string ProductoNombre, decimal CantidadDisponible);

public class InventarioInvalidoException : Exception
{
    public InventarioInvalidoException(string mensaje) : base(mensaje) {}
}
