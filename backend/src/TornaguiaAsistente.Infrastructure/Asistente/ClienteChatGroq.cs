using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TornaguiaAsistente.Application.Asistente;

namespace TornaguiaAsistente.Infrastructure.Asistente;

/// <summary>
/// Loop de tool-calling contra Groq, compartido por el bot de contribuyente y el gerencial: arma
/// la conversación con el system prompt del llamador, despacha las herramientas que el modelo pida
/// a través de <paramref name="ejecutarHerramienta"/> (cada caller conoce sus propios casos de uso)
/// y devuelve el texto final. No conoce nada de bodegas, solicitudes ni impuestos.
/// </summary>
public class ClienteChatGroq
{
    private const string Modelo = "openai/gpt-oss-120b";
    private const string Url = "https://api.groq.com/openai/v1/chat/completions";
    private const int MaxIteracionesHerramientas = 6;

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ClienteChatGroq> _logger;

    public ClienteChatGroq(HttpClient httpClient, IConfiguration configuration, ILogger<ClienteChatGroq> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> CompletarAsync(
        string systemPrompt,
        JsonArray mensajes,
        JsonArray herramientas,
        Func<string, string, CancellationToken, Task<string>> ejecutarHerramienta,
        CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["Groq:ApiKey"]
            ?? throw new AsistenteNoDisponibleException(
                "El asistente no está disponible: falta configurar Groq:ApiKey en el servidor.");

        var conversacion = new JsonArray { new JsonObject { ["role"] = "system", ["content"] = systemPrompt } };
        foreach (var mensaje in mensajes)
            conversacion.Add(mensaje!.DeepClone());

        try
        {
            return await EjecutarLoopAsync(conversacion, herramientas, apiKey, ejecutarHerramienta, cancellationToken);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _logger.LogError(ex, "No se pudo contactar el asistente (Groq).");
            throw new AsistenteNoDisponibleException(
                "No se pudo conectar con el asistente. Verifica tu conexión e intenta de nuevo.");
        }
    }

    private async Task<string> EjecutarLoopAsync(
        JsonArray mensajes,
        JsonArray herramientas,
        string apiKey,
        Func<string, string, CancellationToken, Task<string>> ejecutarHerramienta,
        CancellationToken cancellationToken)
    {
        for (var iteracion = 0; iteracion < MaxIteracionesHerramientas; iteracion++)
        {
            var cuerpo = new JsonObject
            {
                ["model"] = Modelo,
                ["messages"] = ClonarArray(mensajes),
                ["tools"] = ClonarArray(herramientas),
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

                var resultado = await EjecutarHerramientaConManejoDeErrorAsync(
                    ejecutarHerramienta, nombre, argumentosJson, cancellationToken);
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

    /// <summary>Si una herramienta falla, el modelo recibe el error como resultado de la tool call
    /// (en vez de que la conversación entera se caiga) y puede decidir qué decirle al usuario.</summary>
    private async Task<string> EjecutarHerramientaConManejoDeErrorAsync(
        Func<string, string, CancellationToken, Task<string>> ejecutarHerramienta,
        string nombre, string argumentosJson, CancellationToken cancellationToken)
    {
        try
        {
            return await ejecutarHerramienta(nombre, argumentosJson, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falló la ejecución de la herramienta {Nombre}", nombre);
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

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
