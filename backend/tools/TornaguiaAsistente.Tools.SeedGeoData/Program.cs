using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite;
using NetTopologySuite.Features;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

const string connectionString =
    "Host=localhost;Port=5433;Database=tornaguia_db;Username=tornaguia_user;Password=tornaguia_pass";

var optionsBuilder = new DbContextOptionsBuilder<TornaguiaDbContext>();
optionsBuilder.UseNpgsql(connectionString, npgsqlOptions => npgsqlOptions.UseNetTopologySuite());

var modo = args.Length > 0 ? args[0] : string.Empty;

switch (modo)
{
    case "departamentos":
        await CargarDepartamentos();
        break;
    case "municipios":
        await CargarMunicipios();
        break;
    default:
        Console.WriteLine("Uso: dotnet run -- departamentos | municipios");
        break;
}

// ==========================================================
// CARGA DE DEPARTAMENTOS (ya implementado previamente)
// ==========================================================
async Task CargarDepartamentos()
{
    Console.WriteLine("=== Cargador de polígonos departamentales ===");

    var rutaArchivo = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "..", "database", "raw-data", "colombia-departamentos.geo.json");
    var geoJsonTexto = File.ReadAllText(rutaArchivo);

    var geometryFactory = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);
    var reader = new GeoJsonReader();
    var featureCollection = reader.Read<FeatureCollection>(geoJsonTexto);

    Console.WriteLine($"Se encontraron {featureCollection.Count} departamentos en el archivo.");

    using var context = new TornaguiaDbContext(optionsBuilder.Options);
    var insertados = 0;
    var actualizados = 0;

    foreach (var feature in featureCollection)
    {
        var codigoDane = feature.Attributes["DPTO"]?.ToString() ?? string.Empty;
        var nombre = feature.Attributes["NOMBRE_DPT"]?.ToString() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(codigoDane) || string.IsNullOrWhiteSpace(nombre))
        {
            Console.WriteLine("⚠ Feature sin DPTO o NOMBRE_DPT, se omite.");
            continue;
        }

        MultiPolygon geometriaFinal = feature.Geometry switch
        {
            MultiPolygon mp => mp,
            Polygon p => geometryFactory.CreateMultiPolygon(new[] { p }),
            _ => throw new InvalidOperationException(
                $"Tipo de geometría inesperado para {nombre}: {feature.Geometry.GeometryType}")
        };
        geometriaFinal.SRID = 4326;

        var departamentoExistente = await context.Departamentos
            .FirstOrDefaultAsync(d => d.CodigoDane == codigoDane);

        if (departamentoExistente is null)
        {
            context.Departamentos.Add(new Departamento
            {
                CodigoDane = codigoDane,
                Nombre = nombre,
                Limites = geometriaFinal
            });
            insertados++;
        }
        else
        {
            departamentoExistente.Nombre = nombre;
            departamentoExistente.Limites = geometriaFinal;
            actualizados++;
        }
    }

    await context.SaveChangesAsync();
    Console.WriteLine($"=== Listo. Insertados: {insertados}, Actualizados: {actualizados} ===");
}

// ==========================================================
// CARGA DE MUNICIPIOS (nuevo)
// ==========================================================
async Task CargarMunicipios()
{
    Console.WriteLine("=== Cargador de municipios (DIVIPOLA - DANE) ===");

    var rutaArchivo = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "..", "database", "raw-data", "municipios-colombia.csv");
    Console.WriteLine($"Leyendo archivo: {rutaArchivo}");

    var geometryFactory = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);

    using var context = new TornaguiaDbContext(optionsBuilder.Options);

    // Precargamos todos los departamentos en memoria (solo 33 filas) para
    // no consultar la base de datos una y otra vez dentro del bucle.
    var departamentosPorCodigo = await context.Departamentos
        .ToDictionaryAsync(d => d.CodigoDane, d => d.Id);

    var config = new CsvConfiguration(CultureInfo.InvariantCulture)
    {
        Delimiter = ",",
        HasHeaderRecord = true
    };

    using var streamReader = new StreamReader(rutaArchivo, System.Text.Encoding.UTF8);
    using var csv = new CsvReader(streamReader, config);

    csv.Read();
    csv.ReadHeader();

    var insertados = 0;
    var actualizados = 0;
    var omitidos = 0;

    while (csv.Read())
    {
        var codigoDepartamento = csv.GetField(0)?.Trim() ?? string.Empty;
        var codigoMunicipio = csv.GetField(2)?.Trim() ?? string.Empty;
        var nombreMunicipio = csv.GetField(3)?.Trim() ?? string.Empty;
        var longitudTexto = csv.GetField(5)?.Trim() ?? string.Empty;
        var latitudTexto = csv.GetField(6)?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(codigoMunicipio) || string.IsNullOrWhiteSpace(nombreMunicipio))
        {
            omitidos++;
            continue;
        }

        if (!departamentosPorCodigo.TryGetValue(codigoDepartamento, out var departamentoId))
        {
            Console.WriteLine($"⚠ Departamento con código '{codigoDepartamento}' no encontrado, se omite {nombreMunicipio}.");
            omitidos++;
            continue;
        }

        // Las coordenadas vienen con coma decimal ("-75,581775"), hay que
        // convertirlas a formato invariante (punto) antes de parsear.
        if (!double.TryParse(longitudTexto.Replace(",", "."), NumberStyles.Float, CultureInfo.InvariantCulture, out var longitud) ||
            !double.TryParse(latitudTexto.Replace(",", "."), NumberStyles.Float, CultureInfo.InvariantCulture, out var latitud))
        {
            Console.WriteLine($"⚠ Coordenadas inválidas para {nombreMunicipio}, se omite.");
            omitidos++;
            continue;
        }

        var punto = geometryFactory.CreatePoint(new Coordinate(longitud, latitud));
        punto.SRID = 4326;

        var municipioExistente = await context.Municipios
            .FirstOrDefaultAsync(m => m.CodigoDane == codigoMunicipio);

        if (municipioExistente is null)
        {
            context.Municipios.Add(new Municipio
            {
                CodigoDane = codigoMunicipio,
                Nombre = nombreMunicipio,
                DepartamentoId = departamentoId,
                Ubicacion = punto
            });
            insertados++;
        }
        else
        {
            municipioExistente.Nombre = nombreMunicipio;
            municipioExistente.DepartamentoId = departamentoId;
            municipioExistente.Ubicacion = punto;
            actualizados++;
        }
    }

    await context.SaveChangesAsync();
    Console.WriteLine();
    Console.WriteLine($"=== Listo. Insertados: {insertados}, Actualizados: {actualizados}, Omitidos: {omitidos} ===");
}