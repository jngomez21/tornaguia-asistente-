namespace TornaguiaAsistente.Application.Catalogos;

public interface ICasoUsoCrearProducto
{
    Task<ProductoResponse> EjecutarAsync(string nombre, decimal capacidad);
}

public class ProductoInvalidoException : Exception
{
    public ProductoInvalidoException(string mensaje) : base(mensaje) {}
}
