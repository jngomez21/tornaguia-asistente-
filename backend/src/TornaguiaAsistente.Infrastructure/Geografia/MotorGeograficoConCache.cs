using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using TornaguiaAsistente.Application.Geografia;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Geografia;

public class MotorGeograficoConCache : IMotorGeografico
{
    private readonly TornaguiaDbContext _context;
    private readonly MotorGeograficoMapbox _motorReal;

    public MotorGeograficoConCache(TornaguiaDbContext context, MotorGeograficoMapbox motorReal)
    {
        _context = context;
        _motorReal = motorReal;
    }

    public async Task<ResultadoRuta> CalcularRutaAsync(int municipioOrigenId, int municipioDestinoId)
    {
        var rutaCacheada = await _context.RutasCalculadas
            .FirstOrDefaultAsync( r =>
                r.MunicipioOrigenId == municipioOrigenId &&
                r.MunicipioDestinoId == municipioDestinoId);

        if (rutaCacheada is not null)
        {
            var departamentosCacheados = JsonSerializer.Deserialize<List<int>>(
                rutaCacheada.DepartamentosIntermedios) ?? new List<int>();
            var geometriaCacheada = rutaCacheada.Geometria?.Coordinates
                .Select(c => new[] { c.X, c.Y })
                .ToList() ?? new List<double[]>();

            return new ResultadoRuta(
                DistanciaKm: (double)rutaCacheada.DistanciaKm,
                TiempoEstimadoMinutos: rutaCacheada.TiempoEstimadoMinutos,
                DepartamentosIntermedioIds: departamentosCacheados,
                Geometria: geometriaCacheada
            );
        }

        var resultado = await _motorReal.CalcularRutaAsync(municipioOrigenId, municipioDestinoId);

        var geometryFactory = NetTopologySuite.NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);
        var lineaRuta = geometryFactory.CreateLineString(
            resultado.Geometria.Select(p => new Coordinate(p[0], p[1])).ToArray());
        lineaRuta.SRID = 4326;

        _context.RutasCalculadas.Add(new RutaCalculada
        {
            MunicipioOrigenId = municipioOrigenId,
            MunicipioDestinoId = municipioDestinoId,
            DepartamentosIntermedios = JsonSerializer.Serialize(resultado.DepartamentosIntermedioIds),
            DistanciaKm = (decimal)resultado.DistanciaKm,
            TiempoEstimadoMinutos = resultado.TiempoEstimadoMinutos,
            FechaConsulta = DateTime.UtcNow,
            Geometria = lineaRuta
        });
        await _context.SaveChangesAsync();

        return resultado;
    }
}