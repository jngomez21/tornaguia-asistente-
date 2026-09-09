namespace TornaguiaAsistente.Application.Inventario;

public interface ICasoUsoObtenerImpuestoPorProducto
{
    Task<IReadOnlyList<ImpuestoPorProductoResponse>> EjecutarAsync(int usuarioId);
}

/// <summary>Impuesto al consumo acumulado por producto, de mayor a menor.</summary>
public record ImpuestoPorProductoResponse(int ProductoId, string ProductoNombre, decimal ValorImpuestoTotal);
