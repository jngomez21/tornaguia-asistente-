namespace TornaguiaAsistente.Application.Geografia;

public interface IMotorGeografico
{
    Task<ResultadoRuta> CalcularRutaAsync(int municipioOrigenId, int municipioDestinoId);    
}

public record ResultadoRuta(
    double DistanciaKm,
    int TiempoEstimadoMinutos,
    IReadOnlyList<int> DepartamentosIntermedioIds
);