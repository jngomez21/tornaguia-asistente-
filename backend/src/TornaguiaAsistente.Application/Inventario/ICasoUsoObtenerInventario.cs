namespace TornaguiaAsistente.Application.Inventario;

public interface ICasoUsoObtenerInventario
{
    /// <summary>Verifica siempre que la bodega pertenezca al usuario. Es el único método que deben
    /// usar las rutas de contribuyente.</summary>
    Task<IReadOnlyList<InventarioItemResponse>> EjecutarAsync(int bodegaId, int usuarioId);

    /// <summary>Sin verificación de dueño: exclusivo del módulo gerencial. El nombre lo dice a
    /// propósito — así saltarse la comprobación nunca puede ocurrir por inercia o por un null
    /// pasado sin querer.</summary>
    Task<IReadOnlyList<InventarioItemResponse>> EjecutarSinVerificarDuenoAsync(int bodegaId);
}
