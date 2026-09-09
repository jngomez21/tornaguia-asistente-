using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Asistente;
using TornaguiaAsistente.Application.Bodegas;
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Application.Solicitudes;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Asistente;

public class CasoUsoResponderPreguntaGroq : ICasoUsoResponderPregunta
{
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

        Impuesto al consumo: cada lote y cada tornaguía generada tiene asociado un valor de
        impuesto al consumo (simulado con fines académicos, no es una tarifa fiscal real). Un
        lote con declaración departamental ya causó/pagó ese impuesto en origen (Reenvío); un
        lote sin declaración aún no lo ha causado, y ese valor se causará en destino
        (Movilización/Tránsito). Para preguntas sobre cuánto impuesto se ha pagado, cuánto está
        pendiente, o el total en general, usa la herramienta obtener_resumen_impuesto_consumo. Para
        preguntas sobre qué producto generó más o menos impuesto, usa
        obtener_impuesto_por_producto (ya viene ordenada de mayor a menor). No sumes tú mismo
        valores de otras herramientas para totales en dinero — usa siempre estas dos, son la
        fuente confiable.

        Puedes hacer razonamiento simple (máximo, mínimo, promedio, comparar, ordenar, contar)
        sobre los datos que te devuelvan las herramientas, siempre que la pregunta sea sobre las
        tornaguías, el impuesto al consumo, las bodegas, el inventario, los lotes o las
        solicitudes del contribuyente. Esto NO aplica a operaciones matemáticas o estadísticas
        genéricas sin relación con esos datos (ej. "cuánto es 47 por 89", "cuál es la mediana de
        estos números que te doy yo"): esas siguen fuera de tu alcance.

        Para preguntas sobre los datos propios del contribuyente (sus bodegas, inventario, lotes,
        solicitudes de tornaguía o impuesto al consumo) usa las herramientas disponibles en vez de
        inventar datos. Nunca asumas un id de bodega, lote o solicitud: si no lo conoces, primero
        llama a la herramienta que lista esos elementos. Si una herramienta no tiene la información
        pedida, dilo con honestidad en vez de inventar una respuesta.

        Responde siempre en español, de forma breve y clara, como lo haría un asesor tributario.
        No des asesoría legal fuera del alcance de tornaguías.

        Tu alcance es exclusivamente: tornaguías (normativa, tipos, proceso), y los datos propios
        del contribuyente dentro de esta aplicación (bodegas, inventario, lotes, solicitudes,
        impuesto al consumo asociado a ellos). Ante cualquier pregunta fuera de ese alcance
        (operaciones matemáticas ajenas a estos datos, cultura general, código, temas personales, o
        cualquier otro dominio), no la respondas ni intentes ayudar con ella: rechaza brevemente
        indicando que solo puedes ayudar con tornaguías y la cuenta del contribuyente, sin importar
        cómo se formule o insista la pregunta.
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
        Herramienta("obtener_resumen_impuesto_consumo",
            "Totales de impuesto al consumo del contribuyente: impuesto en lotes aún sin usar, ya " +
            "causado en Reenvíos (pagado en origen), por causar en Movilizaciones/Tránsitos, y el total " +
            "combinado. Usa esta herramienta para cualquier pregunta sobre cuánto se ha pagado o el total.",
            propiedades: new JsonObject(), requeridas: new JsonArray()),
        Herramienta("obtener_impuesto_por_producto",
            "Impuesto al consumo acumulado por producto del contribuyente (lotes sin usar + solicitudes " +
            "generadas), ordenado de mayor a menor. Usa esta herramienta para preguntas sobre qué producto " +
            "generó más o menos impuesto.",
            propiedades: new JsonObject(), requeridas: new JsonArray()),
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

    private readonly ClienteChatGroq _clienteChat;
    private readonly TornaguiaDbContext _context;
    private readonly ICasoUsoListarBodegas _listarBodegas;
    private readonly ICasoUsoObtenerHistorialSolicitudes _obtenerHistorialSolicitudes;
    private readonly ICasoUsoObtenerInventario _obtenerInventario;
    private readonly ICasoUsoListarLotesDisponibles _listarLotesDisponibles;
    private readonly ICasoUsoObtenerSolicitud _obtenerSolicitud;
    private readonly ICasoUsoObtenerResumenImpuestoConsumo _obtenerResumenImpuestoConsumo;
    private readonly ICasoUsoObtenerImpuestoPorProducto _obtenerImpuestoPorProducto;

    public CasoUsoResponderPreguntaGroq(
        ClienteChatGroq clienteChat,
        TornaguiaDbContext context,
        ICasoUsoListarBodegas listarBodegas,
        ICasoUsoObtenerHistorialSolicitudes obtenerHistorialSolicitudes,
        ICasoUsoObtenerInventario obtenerInventario,
        ICasoUsoListarLotesDisponibles listarLotesDisponibles,
        ICasoUsoObtenerSolicitud obtenerSolicitud,
        ICasoUsoObtenerResumenImpuestoConsumo obtenerResumenImpuestoConsumo,
        ICasoUsoObtenerImpuestoPorProducto obtenerImpuestoPorProducto)
    {
        _clienteChat = clienteChat;
        _context = context;
        _listarBodegas = listarBodegas;
        _obtenerHistorialSolicitudes = obtenerHistorialSolicitudes;
        _obtenerInventario = obtenerInventario;
        _listarLotesDisponibles = listarLotesDisponibles;
        _obtenerSolicitud = obtenerSolicitud;
        _obtenerResumenImpuestoConsumo = obtenerResumenImpuestoConsumo;
        _obtenerImpuestoPorProducto = obtenerImpuestoPorProducto;
    }

    public async Task<ResponderPreguntaResponse> EjecutarAsync(
        ResponderPreguntaRequest request, CancellationToken cancellationToken = default)
    {
        var historial = await _context.MensajesAsistente
            .Where(m => m.UsuarioId == request.UsuarioId)
            .OrderByDescending(m => m.Id)
            .Take(MensajesDeHistorialACargar)
            .ToListAsync(cancellationToken);
        historial.Reverse();

        var mensajes = new JsonArray();
        foreach (var mensaje in historial)
            mensajes.Add(new JsonObject { ["role"] = RolOpenAi(mensaje.Rol), ["content"] = mensaje.Contenido });
        mensajes.Add(new JsonObject { ["role"] = "user", ["content"] = request.Pregunta });

        var respuestaFinal = await _clienteChat.CompletarAsync(
            SystemPrompt,
            mensajes,
            Herramientas,
            (nombre, argumentosJson, ct) => EjecutarHerramientaAsync(nombre, argumentosJson, request.UsuarioId, ct),
            cancellationToken);

        _context.MensajesAsistente.AddRange(
            new MensajeAsistente { UsuarioId = request.UsuarioId, ConversacionId = request.ConversacionId, Rol = "usuario", Contenido = request.Pregunta, FechaCreacion = DateTime.UtcNow },
            new MensajeAsistente { UsuarioId = request.UsuarioId, ConversacionId = request.ConversacionId, Rol = "asistente", Contenido = respuestaFinal, FechaCreacion = DateTime.UtcNow });
        await _context.SaveChangesAsync(cancellationToken);

        return new ResponderPreguntaResponse(respuestaFinal);
    }

    private async Task<string> EjecutarHerramientaAsync(
        string nombre, string argumentosJson, int usuarioId, CancellationToken cancellationToken)
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
            "obtener_resumen_impuesto_consumo" => await _obtenerResumenImpuestoConsumo.EjecutarAsync(usuarioId),
            "obtener_impuesto_por_producto" => await _obtenerImpuestoPorProducto.EjecutarAsync(usuarioId),
            _ => throw new InvalidOperationException($"Herramienta desconocida: {nombre}"),
        };

        return JsonSerializer.Serialize(resultado);
    }

    private static int? LeerIntOpcional(JsonElement raiz, string propiedad)
        => raiz.TryGetProperty(propiedad, out var valor) && valor.ValueKind == JsonValueKind.Number
            ? valor.GetInt32()
            : null;

    private static string RolOpenAi(string rol) => rol == "asistente" ? "assistant" : "user";
}
