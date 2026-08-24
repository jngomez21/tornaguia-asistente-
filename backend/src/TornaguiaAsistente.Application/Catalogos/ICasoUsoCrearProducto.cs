namespace TornaguiaAsistente.Application.Catalogos;

public interface ICasoUsoCrearProducto
{
    Task<ProductoResponse> EjecutarAsync(string nombre);
}

public class ProductoInvalidoException : Exception
{
    public ProductoInvalidoException(string mensaje) : base(mensaje) {}
}
