using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NetTopologySuite.Geometries;
using NetTopologySuite.LinearReferencing;
using TornaguiaAsistente.Application.Geografia;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Geografia;

public class MotorGeograficoMapbox : IMotorGeografico
{
    private const double RadioTierraKm = 6371.0;

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

    public async Task<ResultadoRuta> CalcularRutaAsync(
        int municipioOrigenId, int municipioDestinoId, CancellationToken cancellationToken = default)
    {
        var origen = await _context.Municipios.FindAsync([municipioOrigenId], cancellationToken)
            ?? throw new InvalidOperationException($"Municipio origen {municipioOrigenId} no encontrado.");
        var destino = await _context.Municipios.FindAsync([municipioDestinoId], cancellationToken)
            ?? throw new InvalidOperationException($"Municipio destino {municipioDestinoId} no encontrado.");

        if (origen.Ubicacion is null || destino.Ubicacion is null)
            throw new InvalidOperationException("Origen o destino no tienen coordenadas cargadas.");

        return await CalcularAsync(
            origen.Ubicacion, origen.Nombre, origen.DepartamentoId,
            destino.Ubicacion, destino.Nombre, destino.DepartamentoId,
            cancellationToken);
    }

    public async Task<ResultadoRuta> CalcularRutaHaciaPaisAsync(
        int municipioOrigenId, int paisDestinoId, CancellationToken cancellationToken = default)
    {
        var origen = await _context.Municipios.FindAsync([municipioOrigenId], cancellationToken)
            ?? throw new InvalidOperationException($"Municipio origen {municipioOrigenId} no encontrado.");
        var destino = await _context.Paises.FindAsync([paisDestinoId], cancellationToken)
            ?? throw new InvalidOperationException($"País destino {paisDestinoId} no encontrado.");

        if (origen.Ubicacion is null)
            throw new InvalidOperationException("Origen no tiene coordenadas cargadas.");
        if (destino.PuntoReferencia is null)
            throw new InvalidOperationException(
                $"El país '{destino.Nombre}' no tiene un punto de referencia (PuntoReferencia) configurado.");

        // Un país no tiene un departamento colombiano propio que excluir de los "intermedios".
        return await CalcularAsync(
            origen.Ubicacion, origen.Nombre, origen.DepartamentoId,
            destino.PuntoReferencia, destino.Nombre, destinoDepartamentoIdAExcluir: null,
            cancellationToken);
    }

    /// <summary>
    /// Pide la ruta a Mapbox Directions entre dos puntos; si Mapbox no encuentra ninguna ruta
    /// terrestre (destinos sin conexión vial, como Panamá por el Tapón del Darién o municipios
    /// como Acandí), no falla: cae a una línea recta de 2 puntos entre origen y destino, marcada
    /// como EsAproximada, para que siempre haya algo que mostrar en el mapa.
    /// </summary>
    private async Task<ResultadoRuta> CalcularAsync(
        Point origenPunto, string origenNombre, int? origenDepartamentoIdAExcluir,
        Point destinoPunto, string destinoNombre, int? destinoDepartamentoIdAExcluir,
        CancellationToken cancellationToken)
    {
        var coordenadasUrl = string.Format(
            System.Globalization.CultureInfo.InvariantCulture,
            "{0},{1};{2},{3}",
            origenPunto.X, origenPunto.Y,
            destinoPunto.X, destinoPunto.Y);

        var url = $"https://api.mapbox.com/directions/v5/mapbox/driving/{coordenadasUrl}" +
                   $"?geometries=geojson&overview=full&access_token={_accessToken}";

        var respuesta = await _httpClient.GetAsync(url, cancellationToken);
        var json = await respuesta.Content.ReadAsStringAsync(cancellationToken);

        if (!respuesta.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"Mapbox devolvió {(int)respuesta.StatusCode}: {json}");
        }
        using var documento = JsonDocument.Parse(json);

        var rutas = documento.RootElement.GetProperty("routes");

        var geometryFactory = NetTopologySuite.NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);

        LineString lineaRuta;
        double distanciaKm;
        int? tiempoEstimadoMinutos;
        bool esAproximada;

        if (rutas.GetArrayLength() == 0)
        {
            lineaRuta = geometryFactory.CreateLineString([origenPunto.Coordinate, destinoPunto.Coordinate]);
            distanciaKm = DistanciaHaversineKm(origenPunto, destinoPunto);
            tiempoEstimadoMinutos = null;
            esAproximada = true;
        }
        else
        {
            var ruta = rutas[0];
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

            lineaRuta = geometryFactory.CreateLineString(puntos.ToArray());
            distanciaKm = Math.Round(distanciaMetros / 1000, 2);
            tiempoEstimadoMinutos = (int)Math.Round(duracionSegundos / 60);
            esAproximada = false;
        }
        lineaRuta.SRID = 4326;

        // "Intermedios" excluye los departamentos del propio origen y destino (la línea siempre
        // los toca, al empezar/terminar dentro de ellos) y queda ordenado por dónde la ruta entra
        // primero a cada uno, no por el orden arbitrario que devuelva la consulta. Cuando el
        // destino es un país, no hay departamento de destino que excluir.
        var departamentosCandidatos = await _context.Departamentos
            .Where(d => lineaRuta.Intersects(d.Limites!))
            .Select(d => new { d.Id, d.Limites })
            .ToListAsync(cancellationToken);

        var lineaIndexada = new LengthIndexedLine(lineaRuta);

        double PosicionDeEntrada(Geometry limites)
        {
            var interseccion = lineaRuta.Intersection(limites);
            return interseccion.IsEmpty
                ? double.MaxValue
                : interseccion.Coordinates.Min(c => lineaIndexada.IndexOf(c));
        }

        var departamentosIntermedios = departamentosCandidatos
            .Where(d => d.Id != origenDepartamentoIdAExcluir && d.Id != destinoDepartamentoIdAExcluir)
            .Select(d => new { d.Id, Posicion = PosicionDeEntrada(d.Limites!) })
            .OrderBy(x => x.Posicion)
            .Select(x => x.Id)
            .ToList();

        return new ResultadoRuta(
            DistanciaKm: distanciaKm,
            TiempoEstimadoMinutos: tiempoEstimadoMinutos,
            DepartamentosIntermedioIds: departamentosIntermedios,
            Geometria: lineaRuta.Coordinates.Select(c => new[] { c.X, c.Y }).ToList(),
            EsAproximada: esAproximada
        );
    }

    /// <summary>Distancia geodésica (círculo máximo) entre dos puntos lat/lon, en kilómetros.</summary>
    private static double DistanciaHaversineKm(Point a, Point b)
    {
        var lat1 = DegreesToRadians(a.Y);
        var lat2 = DegreesToRadians(b.Y);
        var deltaLat = DegreesToRadians(b.Y - a.Y);
        var deltaLon = DegreesToRadians(b.X - a.X);

        var h = Math.Sin(deltaLat / 2) * Math.Sin(deltaLat / 2) +
                Math.Cos(lat1) * Math.Cos(lat2) * Math.Sin(deltaLon / 2) * Math.Sin(deltaLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(h), Math.Sqrt(1 - h));

        return Math.Round(RadioTierraKm * c, 2);
    }

    private static double DegreesToRadians(double grados) => grados * Math.PI / 180;
}
