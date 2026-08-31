namespace TornaguiaAsistente.Application.Inventario;

public interface ICasoUsoCrearLoteDesdeDeclaracion
{
    Task<LoteResponse> EjecutarAsync(CrearLoteDesdeDeclaracionRequest request);
}

public record CrearLoteDesdeDeclaracionRequest(
    int BodegaId,
    int UsuarioId,
    string NumeroDeclaracion,
    int DepartamentoId,
    string Periodo,
    string RemitenteNombre,
    string RemitenteIdentificacion,
    byte[] DocumentoBytes,
    string DocumentoNombreArchivo,
    string DocumentoContentType,
    IReadOnlyList<ProductoDeclaradoRequest> Productos
);

public record ProductoDeclaradoRequest(string ProductoNombre, decimal Capacidad, decimal Cantidad);
