namespace TornaguiaAsistente.Application.Ia;

public interface IExtractorDeclaracion
{
    Task<DeclaracionDetectada> ExtraerAsync(byte[] documentoBytes, string contentType);
}

public record DeclaracionDetectada(
    string? NumeroDeclaracion,
    string? DepartamentoNombreDetectado,
    string? Periodo,
    string? RemitenteNombre,
    string? RemitenteIdentificacion,
    IReadOnlyList<ProductoDetectado> Productos
);

public record ProductoDetectado(string NombreDetectado, decimal Cantidad, decimal? Capacidad);

public class ExtraccionDeclaracionException : Exception
{
    public ExtraccionDeclaracionException(string mensaje) : base(mensaje) {}
}
