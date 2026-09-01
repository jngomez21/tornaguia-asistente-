using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using TornaguiaAsistente.Application.Geografia;
using TornaguiaAsistente.Application.Solicitudes;
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
            .FirstOrDefaultAsync( r =>
                r.MunicipioOrigenId == municipioOrigenId &&
                r.MunicipioDestinoId == municipioDestinoId,
                cancellationToken);

        if (rutaCacheada is not null && rutaCacheada.Geometria is not null)
        {
            var departamentosCacheados = JsonSerializer.Deserialize<List<int>>(
                rutaCacheada.DepartamentosIntermedios) ?? new List<int>();
            var geometriaCacheada = rutaCacheada.Geometria.Coordinates
                .Select(c => new[] { c.X, c.Y })
                .ToList();

            return new ResultadoRuta(
                DistanciaKm: (double)rutaCacheada.DistanciaKm,
                TiempoEstimadoMinutos: rutaCacheada.TiempoEstimadoMinutos,
                DepartamentosIntermedioIds: departamentosCacheados,
                Geometria: geometriaCacheada
            );
        }

        if (rutaCacheada is not null && rutaCacheada.Geometria is null)
        {
            // Ya se determinó antes que no existe ruta terrestre entre este par de
            // municipios (ver MotorGeograficoMapbox); se evita repetir la llamada
            // a Mapbox para el mismo par origen-destino.
            throw new SolicitudInvalidaException(
                $"No existe una ruta terrestre entre los municipios {municipioOrigenId} y {municipioDestinoId}.");
        }

        ResultadoRuta resultado;
        try
        {
            resultado = await _motorReal.CalcularRutaAsync(municipioOrigenId, municipioDestinoId, cancellationToken);
        }
        catch (SolicitudInvalidaException)
        {
            await GuardarSinRutaAsync(municipioOrigenId, municipioDestinoId, cancellationToken);
            throw;
        }

        var geometryFactory = NetTopologySuite.NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);
        var lineaRuta = geometryFactory.CreateLineString(
            resultado.Geometria.Select(p => new Coordinate(p[0], p[1])).ToArray());
        lineaRuta.SRID = 4326;

        var nuevaRuta = new RutaCalculada
        {
            MunicipioOrigenId = municipioOrigenId,
            MunicipioDestinoId = municipioDestinoId,
            DepartamentosIntermedios = JsonSerializer.Serialize(resultado.DepartamentosIntermedioIds),
            DistanciaKm = (decimal)resultado.DistanciaKm,
            TiempoEstimadoMinutos = resultado.TiempoEstimadoMinutos,
            FechaConsulta = DateTime.UtcNow,
            Geometria = lineaRuta
        };
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

        return resultado;
    }

    private async Task GuardarSinRutaAsync(int municipioOrigenId, int municipioDestinoId, CancellationToken cancellationToken)
    {
        var sinRuta = new RutaCalculada
        {
            MunicipioOrigenId = municipioOrigenId,
            MunicipioDestinoId = municipioDestinoId,
            DepartamentosIntermedios = "[]",
            DistanciaKm = 0,
            TiempoEstimadoMinutos = 0,
            FechaConsulta = DateTime.UtcNow,
            Geometria = null,
        };
        _context.RutasCalculadas.Add(sinRuta);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (EsViolacionDeUnicidad(ex))
        {
            // Otra solicitud concurrente ya registró este mismo resultado
            // (con o sin ruta) antes que esta.
            _context.Entry(sinRuta).State = EntityState.Detached;
        }
    }

    private static bool EsViolacionDeUnicidad(DbUpdateException ex) =>
        ex.InnerException is Npgsql.PostgresException { SqlState: "23505" };
}
