namespace TornaguiaAsistente.Application.Catalogos;

public interface ICasoUsoListarProductos
{
    Task<IReadOnlyList<ProductoResponse>> EjecutarAsync();
}

public record ProductoResponse(int Id, string Nombre);
