namespace TornaguiaAsistente.Application.Geografia;

public interface IMotorGeografico
{
    Task<ResultadoRuta> CalcularRutaAsync(
        int municipioOrigenId, int municipioDestinoId, CancellationToken cancellationToken = default);
}

public record ResultadoRuta(
    double DistanciaKm,
    int TiempoEstimadoMinutos,
    IReadOnlyList<int> DepartamentosIntermedioIds,
    IReadOnlyList<double[]> Geometria
);