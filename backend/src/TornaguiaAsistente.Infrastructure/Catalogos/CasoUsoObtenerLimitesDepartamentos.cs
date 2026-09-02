using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using NetTopologySuite.Simplify;
using TornaguiaAsistente.Application.Catalogos;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Catalogos;

public class CasoUsoObtenerLimitesDepartamentos : ICasoUsoObtenerLimitesDepartamentos
{
    // Grados (~1.1 km en el ecuador). Los límites se usan para un overlay decorativo en el
    // mapa, no para determinar jurisdicción legal, así que se simplifican para no mandar al
    // frontend la geometría completa de DANE (miles de vértices por departamento).
    private const double ToleranciaSimplificacionGrados = 0.01;

    // Los límites departamentales son catálogo estático (no hay endpoint que los modifique en
    // caliente), así que se cachean en memoria por proceso: evita repetir la simplificación de
    // NetTopologySuite en cada solicitud de cada usuario para los mismos 33 departamentos.
    private static readonly ConcurrentDictionary<int, DepartamentoLimitesResponse> _cache = new();

    private readonly TornaguiaDbContext _context;

    public CasoUsoObtenerLimitesDepartamentos(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<DepartamentoLimitesResponse>> EjecutarAsync(
        IReadOnlyList<int> departamentoIds, CancellationToken cancellationToken = default)
    {
        var idsFaltantes = departamentoIds.Distinct().Where(id => !_cache.ContainsKey(id)).ToList();

        if (idsFaltantes.Count > 0)
        {
            var departamentos = await _context.Departamentos
                .Where(d => idsFaltantes.Contains(d.Id) && d.Limites != null)
                .Select(d => new { d.Id, d.Nombre, d.Limites })
                .ToListAsync(cancellationToken);

            foreach (var d in departamentos)
            {
                var simplificado = TopologyPreservingSimplifier.Simplify(d.Limites!, ToleranciaSimplificacionGrados);
                _cache[d.Id] = new DepartamentoLimitesResponse(d.Id, d.Nombre, ConvertirMultiPoligono(simplificado));
            }
        }

        return departamentoIds
            .Distinct()
            .Select(id => _cache.GetValueOrDefault(id))
            .Where(d => d is not null)
            .Select(d => d!)
            .ToList();
    }

    // La geometría simplificada puede volver como Polygon en vez de MultiPolygon cuando el
    // departamento no tiene islas/enclaves separados; NumGeometries/GetGeometryN funcionan
    // igual para ambos casos, por eso se trabaja sobre Geometry en vez de forzar el cast.
    private static IReadOnlyList<IReadOnlyList<IReadOnlyList<double[]>>> ConvertirMultiPoligono(Geometry geometria) =>
        Enumerable.Range(0, geometria.NumGeometries)
            .Select(i => ConvertirPoligono((Polygon)geometria.GetGeometryN(i)))
            .ToList();

    private static IReadOnlyList<IReadOnlyList<double[]>> ConvertirPoligono(Polygon poligono) =>
        new[] { poligono.ExteriorRing }
            .Concat(poligono.InteriorRings)
            .Select(anillo => (IReadOnlyList<double[]>)anillo.Coordinates.Select(c => new[] { c.X, c.Y }).ToList())
            .ToList();
}
