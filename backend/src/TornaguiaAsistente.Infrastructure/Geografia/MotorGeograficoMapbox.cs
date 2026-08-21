using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NetTopologySuite.Geometries;
using TornaguiaAsistente.Application.Geografia;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Geografia;

public class MotorGeograficoMapbox : IMotorGeografico
{
    private readonly HttpClient _httpClient;
    private readonly TornaguiaDbContext _context;
    private readonly string _accessToken;

    public MotorGeograficoMapbox(
        HttpClient httpClient,
        TornaguiaDbContext context,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _context = context;
        _accessToken = configuration["Mapbox:AccessToken"]
            ?? throw new InvalidOperationException("Falta configurar Mapbox:AccessToken");
    }

    public async Task<ResultadoRuta> CalcularRutaAsync(int municipioOrigenId, int municipioDestinoId)
    {
        var origen = await _context.Municipios.FindAsync(municipioOrigenId)
            ?? throw new InvalidOperationException($"Municipio origen {municipioOrigenId} no encontrado.");
        var destino = await _context.Municipios.FindAsync(municipioDestinoId)
            ?? throw new InvalidOperationException($"Municipio destino {municipioDestinoId} no encontrado.");

        if (origen.Ubicacion is null || destino.Ubicacion is null)
            throw new InvalidOperationException("Origen o destino no tienen coordenadas cargadas.");

        var coordenadasUrl = string.Format(
            System.Globalization.CultureInfo.InvariantCulture,
            "{0},{1};{2},{3}",
            origen.Ubicacion.X, origen.Ubicacion.Y,
            destino.Ubicacion.X, destino.Ubicacion.Y);

        var url = $"https://api.mapbox.com/directions/v5/mapbox/driving/{coordenadasUrl}" +
                   $"?geometries=geojson&overview=full&access_token={_accessToken}";

        var respuesta = await _httpClient.GetAsync(url);
        var json = await respuesta.Content.ReadAsStringAsync();

        if (!respuesta.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"Mapbox devolvió {(int)respuesta.StatusCode}: {json}");
        }
        using var documento = JsonDocument.Parse(json);

        var ruta = documento.RootElement.GetProperty("routes")[0];
        var distanciaMetros = ruta.GetProperty("distance").GetDouble();
        var duracionSegundos = ruta.GetProperty("duration").GetDouble();

        var coordenadasGeometria = ruta.GetProperty("geometry").GetProperty("coordinates");
        var puntos = new List<Coordinate>();
        foreach (var punto in coordenadasGeometria.EnumerateArray())
        {
            var lon = punto[0].GetDouble();
            var lat = punto[1].GetDouble();
            puntos.Add(new Coordinate(lon, lat));
        }

        var geometryFactory = NetTopologySuite.NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);
        var lineaRuta = geometryFactory.CreateLineString(puntos.ToArray());
        lineaRuta.SRID = 4326;

        var departamentosIntermedios = await _context.Departamentos
            .Where(d => lineaRuta.Intersects(d.Limites!))
            .Select(d => d.Id)
            .ToListAsync();

        return new ResultadoRuta(
            DistanciaKm: Math.Round(distanciaMetros / 1000, 2),
            TiempoEstimadoMinutos: (int)Math.Round(duracionSegundos / 60),
            DepartamentosIntermedioIds: departamentosIntermedios,
            Geometria: puntos.Select(p => new[] { p.X, p.Y }).ToList()
        );
    }
}