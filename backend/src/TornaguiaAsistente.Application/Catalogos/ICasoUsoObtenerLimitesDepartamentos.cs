namespace TornaguiaAsistente.Application.Catalogos;

public interface ICasoUsoObtenerLimitesDepartamentos
{
    Task<IReadOnlyList<DepartamentoLimitesResponse>> EjecutarAsync(
        IReadOnlyList<int> departamentoIds, CancellationToken cancellationToken = default);
}

/// <summary>MultiPolygon como arreglos anidados: polígonos -> anillos (0 = exterior, resto = huecos) -> puntos [lon, lat].</summary>
public record DepartamentoLimitesResponse(
    int Id,
    string Nombre,
    IReadOnlyList<IReadOnlyList<IReadOnlyList<double[]>>> Poligonos
);
