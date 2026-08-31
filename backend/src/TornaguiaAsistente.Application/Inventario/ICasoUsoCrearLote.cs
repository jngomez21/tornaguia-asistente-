namespace TornaguiaAsistente.Application.Inventario;

public interface ICasoUsoCrearLote
{
    Task<LoteResponse> EjecutarAsync(CrearLoteRequest request);
}

public record CrearLoteRequest(int BodegaId, int UsuarioId, IReadOnlyList<LoteProductoRequest> Productos);

public record LoteProductoRequest(int ProductoId, decimal Cantidad);

public record LoteResponse(
    int LoteId,
    string NumeroSerie,
    string Estado,
    DateTime FechaCreacion,
    IReadOnlyList<LoteProductoResponse> Productos,
    DeclaracionResumen? Declaracion = null
);

public record LoteProductoResponse(int ProductoId, string ProductoNombre, decimal Cantidad);

public record DeclaracionResumen(
    string NumeroDeclaracion,
    string RemitenteNombre,
    string RemitenteIdentificacion
);
