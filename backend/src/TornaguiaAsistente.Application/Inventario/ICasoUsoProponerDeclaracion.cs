namespace TornaguiaAsistente.Application.Inventario;

public interface ICasoUsoProponerDeclaracion
{
    Task<PropuestaDeclaracionResponse> EjecutarAsync(
        ProponerDeclaracionRequest request, CancellationToken cancellationToken = default);
}

public record ProponerDeclaracionRequest(byte[] DocumentoBytes, string DocumentoContentType);

public record PropuestaDeclaracionResponse(
    string? NumeroDeclaracion,
    int? DepartamentoId,
    string? DepartamentoNombreDetectado,
    string? Periodo,
    string? RemitenteNombre,
    string? RemitenteIdentificacion,
    IReadOnlyList<ProductoPropuesto> Productos
);

public record ProductoPropuesto(
    string NombreDetectado,
    int? ProductoIdCoincidente,
    decimal? CapacidadCoincidente,
    decimal Cantidad,
    decimal? CapacidadDetectada
);
