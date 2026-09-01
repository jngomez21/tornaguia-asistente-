using System.Globalization;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TornaguiaAsistente.Application.Ia;

namespace TornaguiaAsistente.Infrastructure.Ia;

public class ExtractorDeclaracionGemini : IExtractorDeclaracion
{
    private const string Modelo = "gemini-3.6-flash";

    private const string Prompt = """
        Estas leyendo una declaracion departamental de impuesto al consumo (Colombia), en PDF
        o foto de celular. Ignora membretes, texto legal y sellos. Extrae estos campos:

        - numeroDeclaracion: numero de declaracion o folio.
        - departamento: nombre del departamento donde se declaro.
        - periodo: periodo declarado.
        - remitenteNombre: nombre del remitente/declarante.
        - remitenteIdentificacion: NIT del remitente.
        - productos: lista de productos declarados. Para cada uno:
          - nombre: nombre del producto.
          - cantidad: cantidad declarada.
          - capacidadMl: la presentacion del producto en mililitros. Puede aparecer en una
            columna separada, como parte del texto del nombre del producto, o con otras
            palabras (contenido, volumen, c.c., presentacion). Si esta en litros, conviertela
            a mililitros. Para cigarrillos u otros productos que se declaran por unidades o
            cajetillas y no tienen volumen en mililitros, OMITE este campo (no escribas 0).
            Escribe SOLO el numero, sin la unidad: si el documento dice "250 ml" o "250cc",
            escribe 250 (no "250 ml" ni "250cc").

        Ejemplos:
        - "Ron Medellin 750ml x 120 unidades" -> nombre="Ron Medellin", cantidad=120, capacidadMl=750.
        - "Cigarrillos Marlboro x 40 cajetillas" -> nombre="Cigarrillos Marlboro", cantidad=40, sin capacidadMl.

        Si un campo no aparece en el documento o no puedes determinarlo con certeza, dejalo
        vacio (o, en el caso de capacidadMl, omitelo). No inventes datos que no esten en el
        documento.
        """;

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ExtractorDeclaracionGemini> _logger;

    public ExtractorDeclaracionGemini(
        HttpClient httpClient, IConfiguration configuration, ILogger<ExtractorDeclaracionGemini> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<DeclaracionDetectada> ExtraerAsync(
        byte[] documentoBytes, string contentType, CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["Gemini:ApiKey"]
            ?? throw new ExtraccionDeclaracionException(
                "La lectura automática no está disponible: falta configurar Gemini:ApiKey en el servidor.");

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{Modelo}:generateContent?key={apiKey}";

        var cuerpo = new
        {
            contents = new[]
            {
                new
                {
                    parts = new object[]
                    {
                        new { text = Prompt },
                        new
                        {
                            inline_data = new
                            {
                                mime_type = contentType,
                                data = Convert.ToBase64String(documentoBytes),
                            }
                        },
                    }
                }
            },
            generationConfig = new
            {
                responseMimeType = "application/json",
                responseSchema = EsquemaRespuesta,
            }
        };

        string json;
        try
        {
            using var contenido = new StringContent(JsonSerializer.Serialize(cuerpo), Encoding.UTF8, "application/json");
            var respuesta = await _httpClient.PostAsync(url, contenido, cancellationToken);
            json = await respuesta.Content.ReadAsStringAsync(cancellationToken);

            if (!respuesta.IsSuccessStatusCode)
            {
                _logger.LogError("Gemini devolvió {StatusCode}: {Json}", (int)respuesta.StatusCode, json);
                throw new ExtraccionDeclaracionException(MensajeAmigablePorEstado(respuesta.StatusCode));
            }
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _logger.LogError(ex, "No se pudo contactar el servicio de lectura automática (Gemini).");
            throw new ExtraccionDeclaracionException(
                "No se pudo conectar con el servicio de lectura automática. Verifica tu conexión e intenta de nuevo.");
        }

        try
        {
            return InterpretarRespuesta(json);
        }
        catch (Exception ex) when (ex is not ExtraccionDeclaracionException)
        {
            _logger.LogError(ex, "No se pudo interpretar la respuesta de Gemini: {Json}", json);
            throw new ExtraccionDeclaracionException(
                "No se pudo interpretar el documento. Intenta con otra copia o completa los datos manualmente.");
        }
    }

    private static string MensajeAmigablePorEstado(HttpStatusCode statusCode) => statusCode switch
    {
        HttpStatusCode.TooManyRequests or HttpStatusCode.ServiceUnavailable =>
            "El servicio de lectura automática está saturado en este momento. Intenta de nuevo en unos minutos.",
        HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden =>
            "La lectura automática no está disponible en este momento. Contacta al administrador del sistema.",
        HttpStatusCode.BadRequest =>
            "No se pudo leer el documento. Verifica que sea un PDF o una imagen válida e intenta de nuevo.",
        _ => "No se pudo leer el documento automáticamente. Puedes completar los datos manualmente.",
    };

    private DeclaracionDetectada InterpretarRespuesta(string json)
    {
        using var documento = JsonDocument.Parse(json);
        var texto = documento.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();

        if (string.IsNullOrWhiteSpace(texto))
        {
            throw new ExtraccionDeclaracionException(
                "No se pudo interpretar el documento. Intenta con otra copia o completa los datos manualmente.");
        }

        _logger.LogInformation("Gemini extrajo (JSON crudo): {Texto}", texto);

        using var extraido = JsonDocument.Parse(texto);
        var raiz = extraido.RootElement;

        var productos = raiz.TryGetProperty("productos", out var productosEl)
            ? productosEl.EnumerateArray()
                .Select(p => new ProductoDetectado(
                    NombreDetectado: p.GetProperty("nombre").GetString() ?? string.Empty,
                    Cantidad: p.GetProperty("cantidad").GetDecimal(),
                    Capacidad: LeerCapacidadOpcional(p)))
                .Where(p => p.NombreDetectado.Length > 0)
                .ToList()
            : new List<ProductoDetectado>();

        return new DeclaracionDetectada(
            NumeroDeclaracion: LeerTextoOpcional(raiz, "numeroDeclaracion"),
            DepartamentoNombreDetectado: LeerTextoOpcional(raiz, "departamento"),
            Periodo: LeerTextoOpcional(raiz, "periodo"),
            RemitenteNombre: LeerTextoOpcional(raiz, "remitenteNombre"),
            RemitenteIdentificacion: LeerTextoOpcional(raiz, "remitenteIdentificacion"),
            Productos: productos);
    }

    private static string? LeerTextoOpcional(JsonElement raiz, string propiedad)
    {
        if (!raiz.TryGetProperty(propiedad, out var valor) || valor.ValueKind != JsonValueKind.String)
            return null;

        var texto = valor.GetString();
        return string.IsNullOrWhiteSpace(texto) ? null : texto;
    }

    private static decimal? LeerCapacidadOpcional(JsonElement producto)
    {
        if (!producto.TryGetProperty("capacidadMl", out var cap))
            return null;

        // Caso normal: Gemini respeta el esquema y devuelve un numero puro.
        if (cap.ValueKind == JsonValueKind.Number)
            return cap.GetDecimal() is > 0 and var valor ? valor : null;

        // Respaldo: si el modelo devuelve el valor como texto (p. ej. "250 ml"),
        // se extrae la parte numerica en vez de descartar el dato completo.
        if (cap.ValueKind == JsonValueKind.String)
        {
            var coincidencia = Regex.Match(cap.GetString() ?? string.Empty, @"[\d.,]+");
            if (coincidencia.Success &&
                decimal.TryParse(coincidencia.Value.Replace(",", "."), NumberStyles.Any, CultureInfo.InvariantCulture, out var extraido) &&
                extraido > 0)
                return extraido;
        }

        return null;
    }

    private static readonly object EsquemaRespuesta = new
    {
        type = "OBJECT",
        properties = new
        {
            numeroDeclaracion = new { type = "STRING" },
            departamento = new { type = "STRING" },
            periodo = new { type = "STRING" },
            remitenteNombre = new { type = "STRING" },
            remitenteIdentificacion = new { type = "STRING" },
            productos = new
            {
                type = "ARRAY",
                items = new
                {
                    type = "OBJECT",
                    properties = new
                    {
                        nombre = new { type = "STRING" },
                        cantidad = new { type = "NUMBER" },
                        capacidadMl = new { type = "NUMBER", nullable = true },
                    },
                    required = new[] { "nombre", "cantidad" },
                },
            },
        },
        required = new[] { "productos" },
    };
}
