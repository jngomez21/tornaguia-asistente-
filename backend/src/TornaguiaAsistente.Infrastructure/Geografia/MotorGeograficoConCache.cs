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

    public async Task<ResultadoRuta> CalcularRutaAsync(
        int municipioOrigenId, int municipioDestinoId, CancellationToken cancellationToken = default)
    {
        var rutaCacheada = await _context.RutasCalculadas
            .FirstOrDefaultAsync(
                r => r.MunicipioOrigenId == municipioOrigenId && r.MunicipioDestinoId == municipioDestinoId,
                cancellationToken);
        if (rutaCacheada is not null) return DesdeCache(rutaCacheada);

        var resultado = await _motorReal.CalcularRutaAsync(municipioOrigenId, municipioDestinoId, cancellationToken);
        await GuardarEnCacheAsync(
            resultado,
            () => new RutaCalculada { MunicipioOrigenId = municipioOrigenId, MunicipioDestinoId = municipioDestinoId },
            cancellationToken);
        return resultado;
    }

    public async Task<ResultadoRuta> CalcularRutaHaciaPaisAsync(
        int municipioOrigenId, int paisDestinoId, CancellationToken cancellationToken = default)
    {
        var rutaCacheada = await _context.RutasCalculadas
            .FirstOrDefaultAsync(
                r => r.MunicipioOrigenId == municipioOrigenId && r.PaisDestinoId == paisDestinoId,
                cancellationToken);
        if (rutaCacheada is not null) return DesdeCache(rutaCacheada);

        var resultado = await _motorReal.CalcularRutaHaciaPaisAsync(municipioOrigenId, paisDestinoId, cancellationToken);
        await GuardarEnCacheAsync(
            resultado,
            () => new RutaCalculada { MunicipioOrigenId = municipioOrigenId, PaisDestinoId = paisDestinoId },
            cancellationToken);
        return resultado;
    }

    private static ResultadoRuta DesdeCache(RutaCalculada rutaCacheada)
    {
        var departamentosCacheados = JsonSerializer.Deserialize<List<int>>(
            rutaCacheada.DepartamentosIntermedios) ?? new List<int>();

        return new ResultadoRuta(
            DistanciaKm: (double)rutaCacheada.DistanciaKm,
            TiempoEstimadoMinutos: rutaCacheada.TiempoEstimadoMinutos,
            DepartamentosIntermedioIds: departamentosCacheados,
            Geometria: rutaCacheada.Geometria.Coordinates.Select(c => new[] { c.X, c.Y }).ToList(),
            EsAproximada: rutaCacheada.EsAproximada
        );
    }

    private async Task GuardarEnCacheAsync(
        ResultadoRuta resultado, Func<RutaCalculada> nuevaFilaParcial, CancellationToken cancellationToken)
    {
        var geometryFactory = NetTopologySuite.NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);
        var lineaRuta = geometryFactory.CreateLineString(
            resultado.Geometria.Select(p => new Coordinate(p[0], p[1])).ToArray());
        lineaRuta.SRID = 4326;

        var nuevaRuta = nuevaFilaParcial();
        nuevaRuta.DepartamentosIntermedios = JsonSerializer.Serialize(resultado.DepartamentosIntermedioIds);
        nuevaRuta.DistanciaKm = (decimal)resultado.DistanciaKm;
        nuevaRuta.TiempoEstimadoMinutos = resultado.TiempoEstimadoMinutos;
        nuevaRuta.EsAproximada = resultado.EsAproximada;
        nuevaRuta.FechaConsulta = DateTime.UtcNow;
        nuevaRuta.Geometria = lineaRuta;
        _context.RutasCalculadas.Add(nuevaRuta);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (EsViolacionDeUnicidad(ex))
        {
            // Otra solicitud concurrente ya calculó y cacheó esta misma ruta
            // (origen, destino) antes que esta. Se descarta la inserción
            // duplicada del tracker para no volver a intentarla en el próximo
            // SaveChangesAsync de este mismo DbContext; el resultado ya se
            // calculó correctamente con Mapbox, no hace falta reintentarlo.
            _context.Entry(nuevaRuta).State = EntityState.Detached;
        }
    }

    private static bool EsViolacionDeUnicidad(DbUpdateException ex) =>
        ex.InnerException is Npgsql.PostgresException { SqlState: "23505" };
}
