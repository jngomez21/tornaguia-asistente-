namespace TornaguiaAsistente.Application.Bodegas;

public interface ICasoUsoListarBodegas
{
    Task<IReadOnlyList<BodegaResponse>> EjecutarAsync(int usuarioId);
}

public record BodegaResponse(
    int Id,
    string Nombre,
    int MunicipioId,
    string MunicipioNombre,
    string DepartamentoNombre,
    double? Latitud,
    double? Longitud,
    int LotesActivos,
    int ProductosDistintos
);

public class BodegaInvalidaException : Exception
{
    public BodegaInvalidaException(string mensaje) : base(mensaje) {}
}
