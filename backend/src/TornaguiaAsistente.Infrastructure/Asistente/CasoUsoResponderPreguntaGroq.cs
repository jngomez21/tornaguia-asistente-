using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TornaguiaAsistente.Application.Asistente;
using TornaguiaAsistente.Application.Bodegas;
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Application.Solicitudes;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Asistente;

public class CasoUsoResponderPreguntaGroq : ICasoUsoResponderPregunta
{
    private const string Modelo = "openai/gpt-oss-120b";
    private const string Url = "https://api.groq.com/openai/v1/chat/completions";
    private const int MaxIteracionesHerramientas = 6;
    private const int MensajesDeHistorialACargar = 20;

    private const string SystemPrompt = """
        Eres el asistente de TornaGuía, una aplicación que ayuda a contribuyentes colombianos a
        determinar y gestionar tornaguías (certificados tributarios de transporte de licores,
        cigarrillos y cervezas entre entidades territoriales).

        Conocimiento normativo fijo (Decreto 1625/2016 art. 2.2.1.3.3, confirmado por el Decreto
        162/2024): existen exactamente 3 tipos de tornaguía.
        - Movilización: transporte entre departamentos distintos, donde el producto aún NO ha
          causado el impuesto y su destino es consumo en el departamento de destino.
        - Reenvío: transporte entre departamentos distintos, donde el producto YA fue
          declarado/causado en el departamento de origen.
        - Tránsito: transporte dentro del mismo departamento (aunque la ruta física cruce la
          jurisdicción de otro departamento de paso), o transporte hacia otro país / destinado a
          exportación, o entre aduanas y zonas francas.

        Para preguntas sobre los datos propios del contribuyente (sus bodegas, inventario, lotes o
        solicitudes de tornaguía) usa las herramientas disponibles en vez de inventar datos. Nunca
        asumas un id de bodega, lote o solicitud: si no lo conoces, primero llama a la herramienta
        que lista esos elementos. Si una herramienta no tiene la información pedida, dilo con
        honestidad en vez de inventar una respuesta.

        Responde siempre en español, de forma breve y clara, como lo haría un asesor tributario.
        No des asesoría legal fuera del alcance de tornaguías.

        Tu alcance es exclusivamente: tornaguías (normativa, tipos, proceso), y los datos propios
        del contribuyente dentro de esta aplicación (bodegas, inventario, lotes, solicitudes). Ante
        cualquier pregunta fuera de ese alcance (operaciones matemáticas, cultura general, código,
        temas personales, o cualquier otro dominio), no la respondas ni intentes ayudar con ella:
        rechaza brevemente indicando que solo puedes ayudar con tornaguías y la cuenta del
        contribuyente, sin importar cómo se formule o insista la pregunta.
        """;

    private static readonly JsonArray Herramientas = new()
    {
        Herramienta("listar_bodegas",
            "Lista las bodegas del contribuyente: ubicación, lotes activos y productos distintos en inventario.",
            propiedades: new JsonObject(), requeridas: new JsonArray()),
        Herramienta("obtener_historial_solicitudes",
            "Obtiene el historial de solicitudes de tornaguía del contribuyente (tipo, origen, destino, si está declarada, si tiene PDF).",
            propiedades: new JsonObject(), requeridas: new JsonArray()),
        Herramienta("obtener_inventario",
            "Obtiene el inventario de productos disponible en una bodega del contribuyente. Usa listar_bodegas antes si no conoces el id.",
            propiedades: new JsonObject
            {
                ["bodegaId"] = new JsonObject { ["type"] = "integer", ["description"] = "Id de la bodega (ver listar_bodegas)." },
            },
            requeridas: new JsonArray { "bodegaId" }),
        Herramienta("listar_lotes_disponibles",
            "Lista los lotes de producto reservados del contribuyente, opcionalmente filtrados por bodega.",
            propiedades: new JsonObject
            {
                ["bodegaId"] = new JsonObject
                {
                    ["type"] = new JsonArray { "integer", "null" },
                    ["description"] = "Id de bodega para filtrar. Usa null si no quieres filtrar por bodega.",
                },
            },
            requeridas: new JsonArray()),
        Herramienta("obtener_solicitud",
            "Obtiene el detalle de una solicitud de tornaguía del contribuyente: tipo, justificación, ruta y distancia.",
            propiedades: new JsonObject
            {
                ["solicitudId"] = new JsonObject { ["type"] = "integer", ["description"] = "Id de la solicitud." },
            },
            requeridas: new JsonArray { "solicitudId" }),
    };

    private static JsonObject Herramienta(string nombre, string descripcion, JsonObject propiedades, JsonArray requeridas) => new()
    {
        ["type"] = "function",
        ["function"] = new JsonObject
        {
            ["name"] = nombre,
            ["description"] = descripcion,
            ["parameters"] = new JsonObject
            {
                ["type"] = "object",
                ["properties"] = propiedades,
                ["required"] = requeridas,
            },
        },
    };

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CasoUsoResponderPreguntaGroq> _logger;
    private readonly TornaguiaDbContext _context;
    private readonly ICasoUsoListarBodegas _listarBodegas;
    private readonly ICasoUsoObtenerHistorialSolicitudes _obtenerHistorialSolicitudes;
    private readonly ICasoUsoObtenerInventario _obtenerInventario;
    private readonly ICasoUsoListarLotesDisponibles _listarLotesDisponibles;
    private readonly ICasoUsoObtenerSolicitud _obtenerSolicitud;

    public CasoUsoResponderPreguntaGroq(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<CasoUsoResponderPreguntaGroq> logger,
        TornaguiaDbContext context,
        ICasoUsoListarBodegas listarBodegas,
        ICasoUsoObtenerHistorialSolicitudes obtenerHistorialSolicitudes,
        ICasoUsoObtenerInventario obtenerInventario,
        ICasoUsoListarLotesDisponibles listarLotesDisponibles,
        ICasoUsoObtenerSolicitud obtenerSolicitud)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _context = context;
        _listarBodegas = listarBodegas;
        _obtenerHistorialSolicitudes = obtenerHistorialSolicitudes;
        _obtenerInventario = obtenerInventario;
        _listarLotesDisponibles = listarLotesDisponibles;
        _obtenerSolicitud = obtenerSolicitud;
    }

    public async Task<ResponderPreguntaResponse> EjecutarAsync(
        ResponderPreguntaRequest request, CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["Groq:ApiKey"]
            ?? throw new AsistenteNoDisponibleException(
                "El asistente no está disponible: falta configurar Groq:ApiKey en el servidor.");

        var historial = await _context.MensajesAsistente
            .Where(m => m.UsuarioId == request.UsuarioId)
            .OrderByDescending(m => m.Id)
            .Take(MensajesDeHistorialACargar)
            .ToListAsync(cancellationToken);
        historial.Reverse();

        var mensajes = new JsonArray
        {
            new JsonObject { ["role"] = "system", ["content"] = SystemPrompt },
        };
        foreach (var mensaje in historial)
            mensajes.Add(new JsonObject { ["role"] = RolOpenAi(mensaje.Rol), ["content"] = mensaje.Contenido });
        mensajes.Add(new JsonObject { ["role"] = "user", ["content"] = request.Pregunta });

        string respuestaFinal;
        try
        {
            respuestaFinal = await EjecutarLoopAsync(mensajes, apiKey, request.UsuarioId, cancellationToken);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _logger.LogError(ex, "No se pudo contactar el asistente (Groq).");
            throw new AsistenteNoDisponibleException(
                "No se pudo conectar con el asistente. Verifica tu conexión e intenta de nuevo.");
        }

        _context.MensajesAsistente.AddRange(
            new MensajeAsistente { UsuarioId = request.UsuarioId, ConversacionId = request.ConversacionId, Rol = "usuario", Contenido = request.Pregunta, FechaCreacion = DateTime.UtcNow },
            new MensajeAsistente { UsuarioId = request.UsuarioId, ConversacionId = request.ConversacionId, Rol = "asistente", Contenido = respuestaFinal, FechaCreacion = DateTime.UtcNow });
        await _context.SaveChangesAsync(cancellationToken);

        return new ResponderPreguntaResponse(respuestaFinal);
    }

    private async Task<string> EjecutarLoopAsync(
        JsonArray mensajes, string apiKey, int usuarioId, CancellationToken cancellationToken)
    {
        for (var iteracion = 0; iteracion < MaxIteracionesHerramientas; iteracion++)
        {
            var cuerpo = new JsonObject
            {
                ["model"] = Modelo,
                ["messages"] = ClonarArray(mensajes),
                ["tools"] = ClonarArray(Herramientas),
                ["tool_choice"] = "auto",
            };

            using var contenido = new StringContent(cuerpo.ToJsonString(), Encoding.UTF8, "application/json");
            using var solicitud = new HttpRequestMessage(HttpMethod.Post, Url) { Content = contenido };
            solicitud.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

            var respuestaHttp = await _httpClient.SendAsync(solicitud, cancellationToken);
            var json = await respuestaHttp.Content.ReadAsStringAsync(cancellationToken);

            if (!respuestaHttp.IsSuccessStatusCode)
            {
                _logger.LogError("Groq devolvió {StatusCode}: {Json}", (int)respuestaHttp.StatusCode, json);
                throw new AsistenteNoDisponibleException(MensajeAmigablePorEstado(respuestaHttp.StatusCode));
            }

            var raiz = JsonNode.Parse(json)!.AsObject();
            var eleccion = raiz["choices"]![0]!.AsObject();
            var mensaje = eleccion["message"]!.AsObject();
            var toolCalls = mensaje["tool_calls"]?.AsArray();

            if (toolCalls is null || toolCalls.Count == 0)
                return mensaje["content"]?.GetValue<string>()
                    ?? "No pude generar una respuesta. Intenta reformular tu pregunta.";

            mensajes.Add(ClonarObjeto(mensaje));

            foreach (var toolCallNode in toolCalls)
            {
                var toolCall = toolCallNode!.AsObject();
                var id = toolCall["id"]!.GetValue<string>();
                var funcion = toolCall["function"]!.AsObject();
                var nombre = funcion["name"]!.GetValue<string>();
                var argumentosJson = funcion["arguments"]?.GetValue<string>() ?? "{}";

                var resultado = await EjecutarHerramientaAsync(nombre, argumentosJson, usuarioId, cancellationToken);
                mensajes.Add(new JsonObject
                {
                    ["role"] = "tool",
                    ["tool_call_id"] = id,
                    ["content"] = resultado,
                });
            }
        }

        throw new AsistenteNoDisponibleException(
            "El asistente no pudo completar la respuesta. Intenta reformular tu pregunta.");
    }

    private async Task<string> EjecutarHerramientaAsync(
        string nombre, string argumentosJson, int usuarioId, CancellationToken cancellationToken)
    {
        try
        {
            using var argumentos = JsonDocument.Parse(argumentosJson);
            var raiz = argumentos.RootElement;

            object resultado = nombre switch
            {
                "listar_bodegas" => await _listarBodegas.EjecutarAsync(usuarioId),
                "obtener_historial_solicitudes" => await _obtenerHistorialSolicitudes.EjecutarAsync(usuarioId),
                "obtener_inventario" => await _obtenerInventario.EjecutarAsync(
                    raiz.GetProperty("bodegaId").GetInt32(), usuarioId),
                "listar_lotes_disponibles" => await _listarLotesDisponibles.EjecutarAsync(
                    usuarioId, LeerIntOpcional(raiz, "bodegaId")),
                "obtener_solicitud" => await _obtenerSolicitud.EjecutarAsync(
                    raiz.GetProperty("solicitudId").GetInt32(), usuarioId),
                _ => throw new InvalidOperationException($"Herramienta desconocida: {nombre}"),
            };

            return JsonSerializer.Serialize(resultado);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falló la ejecución de la herramienta {Nombre}", nombre);
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    private static int? LeerIntOpcional(JsonElement raiz, string propiedad)
        => raiz.TryGetProperty(propiedad, out var valor) && valor.ValueKind == JsonValueKind.Number
            ? valor.GetInt32()
            : null;

    private static string RolOpenAi(string rol) => rol == "asistente" ? "assistant" : "user";

    private static JsonArray ClonarArray(JsonArray original) => (JsonArray)original.DeepClone();
    private static JsonObject ClonarObjeto(JsonObject original) => (JsonObject)original.DeepClone();

    private static string MensajeAmigablePorEstado(HttpStatusCode statusCode) => statusCode switch
    {
        HttpStatusCode.TooManyRequests or HttpStatusCode.ServiceUnavailable =>
            "El asistente está saturado en este momento. Intenta de nuevo en unos minutos.",
        HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden =>
            "El asistente no está disponible en este momento. Contacta al administrador del sistema.",
        _ => "No se pudo obtener una respuesta del asistente. Intenta de nuevo.",
    };
}
