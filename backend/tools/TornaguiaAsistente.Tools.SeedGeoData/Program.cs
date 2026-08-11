using Microsoft.EntityFrameworkCore;
using NetTopologySuite;
using NetTopologySuite.Features;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;
using TornaguiaAsistente.Infrastructure.Persistence;

Console.WriteLine("=== Cargador de polígonos departamentales ===");


// Configuración de la conexión harcodeada (Es una herramienta de 1 solo uso)
const string connectionString = 
    "Host=localhost;Port=5433;Database=tornaguia_db;Username=tornaguia_user;Password=tornaguia_pass";

var optionsBuilder = new DbContextOptionsBuilder<TornaguiaDbContext>();
optionsBuilder.UseNpgsql(connectionString, npgsqlOptions => npgsqlOptions.UseNetTopologySuite());

//Leer y parsear el archivo GeoJSON
var rutaArchivo = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "colombia-departamentos.geo.json");
Console.WriteLine($"Leyendo archivo {rutaArchivo}");

var geoJsonTexto = File.ReadAllText(rutaArchivo);

var geometryFactory = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);
var reader = new GeoJsonReader();

var featureCollection = reader.Read<FeatureCollection>(geoJsonTexto);

Console.WriteLine($"Se encontraron {featureCollection.Count} departamentos en el archivo");

// Procesar cada departamento e insertarlo/actualizarlo en la bdd
using var context = new TornaguiaDbContext(optionsBuilder.Options);

var insertados = 0;
var actualizados = 0;

foreach (var feature in featureCollection)
{
    var codigoDane = feature.Attributes["DPTO"]?.ToString() ?? string.Empty;
    var nombre = feature.Attributes["NOMBRE_DPT"]?.ToString() ?? string.Empty;

    if (string.IsNullOrWhiteSpace(codigoDane) || string.IsNullOrWhiteSpace(nombre))
    {
        Console.WriteLine($"⚠ Feature sin DPTO o NOMBRE_DPT, se omite");
        continue;
    }

    //Normalizamos a MultiPolygon, pq algunos dptos vienen como 
    // Polygon simple y otros como MultiPolygon(Islas, territorios
    //no contiguos)

    MultiPolygon geometriaFinal = feature.Geometry switch
    {
        MultiPolygon mp => mp,
        Polygon p => geometryFactory.CreateMultiPolygon(new[] {p}),
        _ => throw new InvalidOperationException($"Tipo de geometría inesperado para {nombre}: {feature.Geometry.GeometryType}")

    };

    geometriaFinal.SRID = 4326;

    var departamentoExistente = await context.Departamentos
        .FirstOrDefaultAsync(d => d.CodigoDane == codigoDane);
    
    if (departamentoExistente is null)
    {
        context.Departamentos.Add(new TornaguiaAsistente.Domain.Entities.Departamento
        {
            CodigoDane = codigoDane,
            Nombre = nombre,
            Limites = geometriaFinal
        });
        insertados++;
        Console.WriteLine($"+ Insertado: {nombre} ({codigoDane})");
    }
    else
    {
        departamentoExistente.Nombre = nombre;
        departamentoExistente.Limites = geometriaFinal;
        actualizados++;
        Console.WriteLine($"~ Actualizado: {nombre} ({codigoDane})");
    }
}

await context.SaveChangesAsync();

Console.WriteLine();
Console.WriteLine($"=== Listo. Insertados: {insertados}, Actualizados: {actualizados} ===");