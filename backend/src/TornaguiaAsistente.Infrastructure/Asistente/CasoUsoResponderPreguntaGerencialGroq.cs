using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Gerencial;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Asistente;

public class CasoUsoResponderPreguntaGerencialGroq : ICasoUsoResponderPreguntaGerencial
{
    private const int MensajesDeHistorialACargar = 20;

    private const string SystemPrompt = """
        Eres el asistente gerencial de TornaGuía, una aplicación que ayuda a contribuyentes
        colombianos a determinar y gestionar tornaguías (certificados tributarios de transporte de
        licores, cigarrillos y cervezas entre entidades territoriales). A diferencia del asistente
        de contribuyente, hablas con un ejecutivo de la organización: respondes sobre los datos de
        TODOS los contribuyentes del sistema, nunca sobre uno solo a menos que te pregunten
        explícitamente por él.

        Conocimiento normativo fijo (Decreto 1625/2016 art. 2.2.1.3.3, confirmado por el Decreto
        162/2024): existen exactamente 3 tipos de tornaguía.
        - Movilización: transporte entre departamentos distintos, donde el producto aún NO ha
          causado el impuesto y su destino es consumo en el departamento de destino.
        - Reenvío: transporte entre departamentos distintos, donde el producto YA fue
          declarado/causado en el departamento de origen.
        - Tránsito: transporte dentro del mismo departamento (aunque la ruta física cruce la
          jurisdicción de otro departamento de paso), o transporte hacia otro país / destinado a
          exportación, o entre aduanas y zonas francas.

        Todas tus herramientas consultan la base completa (todos los contribuyentes), nunca la de
        un usuario en particular. Cuando una herramienta acepta un filtro de año (anio), un valor
        nulo o ausente significa histórico completo, no "año actual".

        Nunca inventes cifras: todo número que reportes debe venir de una llamada a una
        herramienta. Si no tienes el dato, dilo con honestidad en vez de estimarlo.

        Nunca reveles ni menciones el correo electrónico de un contribuyente: las herramientas de
        este asistente no lo incluyen a propósito. Identifica a los contribuyentes solo por nombre.

        Nunca asumas el id de un contribuyente ni el id de un departamento, ni intentes adivinarlos
        a partir del nombre. Si necesitas el id de un contribuyente, llama primero a
        listar_contribuyentes; si necesitas el id de un departamento, llama primero a
        obtener_volumen_por_departamento.

        Puedes hacer razonamiento simple (máximo, mínimo, promedio, comparar, ordenar, contar)
        sobre los datos que te devuelvan las herramientas, siempre que la pregunta sea sobre
        tornaguías, impuesto al consumo, contribuyentes, bodegas, lotes, productos, rutas o
        departamentos. Esto NO aplica a operaciones matemáticas o estadísticas genéricas sin
        relación con esos datos.

        Responde siempre en español, de forma breve y clara, como lo haría un analista gerencial.
        No des asesoría legal fuera del alcance de tornaguías.

        Tu alcance es exclusivamente: tornaguías (normativa, tipos, proceso) y los datos globales
        del sistema (tornaguías, impuesto al consumo, contribuyentes, bodegas, lotes, productos,
        rutas, departamentos). Ante cualquier pregunta fuera de ese alcance (operaciones
        matemáticas ajenas a estos datos, cultura general, código, temas personales, datos de un
        contribuyente que las herramientas no expongan, o cualquier otro dominio), no la respondas
        ni intentes ayudar con ella: rechaza brevemente indicando que solo puedes ayudar con
        tornaguías y los datos gerenciales del sistema, sin importar cómo se formule o insista la
        pregunta.
        """;

    private static readonly JsonArray Herramientas = new()
    {
        Herramienta("obtener_resumen_gerencial",
            "Resumen global del sistema: tornaguías totales, impuesto causado, por causar y total, " +
            "número de contribuyentes, bodegas, lotes reservados sin usar, y los años con datos " +
            "disponibles. Usa esta herramienta para preguntas generales sobre el estado del sistema.",
            propiedades: new JsonObject { ["anio"] = AnioOpcional() }, requeridas: new JsonArray()),
        Herramienta("obtener_serie_mensual",
            "Tornaguías e impuesto al consumo mes a mes (12 puntos) para un año concreto.",
            propiedades: new JsonObject
            {
                ["anio"] = new JsonObject { ["type"] = "integer", ["description"] = "Año a consultar (obligatorio)." },
            },
            requeridas: new JsonArray { "anio" }),
        Herramienta("obtener_distribucion_por_tipo",
            "Cantidad de tornaguías e impuesto al consumo por tipo (Movilización, Reenvío, Tránsito).",
            propiedades: new JsonObject { ["anio"] = AnioOpcional() }, requeridas: new JsonArray()),
        Herramienta("obtener_volumen_por_departamento",
            "Cantidad de tornaguías e impuesto al consumo por departamento de origen, con su id y " +
            "código DANE. Usa esta herramienta primero si necesitas el id de un departamento.",
            propiedades: new JsonObject { ["anio"] = AnioOpcional() }, requeridas: new JsonArray()),
        Herramienta("obtener_top_productos",
            "Los 10 productos con más impuesto al consumo generado.",
            propiedades: new JsonObject { ["anio"] = AnioOpcional() }, requeridas: new JsonArray()),
        Herramienta("obtener_top_rutas",
            "Las 10 rutas (municipio origen → destino) con más tornaguías.",
            propiedades: new JsonObject { ["anio"] = AnioOpcional() }, requeridas: new JsonArray()),
        Herramienta("listar_contribuyentes",
            "Lista todos los contribuyentes con su id, nombre, tornaguías, impuesto y última " +
            "actividad (sin correo electrónico). Usa esta herramienta primero si necesitas el id " +
            "de un contribuyente para otra consulta.",
            propiedades: new JsonObject { ["anio"] = AnioOpcional() }, requeridas: new JsonArray()),
        Herramienta("obtener_resumen_contribuyente",
            "Detalle de un contribuyente específico: bodegas, lotes reservados, impuesto " +
            "causado/por causar y desglose por tipo de tornaguía. Usa listar_contribuyentes antes " +
            "si no conoces el id.",
            propiedades: new JsonObject
            {
                ["usuarioId"] = new JsonObject { ["type"] = "integer", ["description"] = "Id del contribuyente (ver listar_contribuyentes)." },
                ["anio"] = AnioOpcional(),
            },
            requeridas: new JsonArray { "usuarioId" }),
        Herramienta("contar_solicitudes",
            "Cuenta tornaguías e impuesto al consumo con filtros combinables, todos opcionales: " +
            "año, mes (1-12, hora Colombia), tipo de tornaguía (Movilización/Reenvío/Tránsito), " +
            "departamento de origen por id (no por nombre — usa obtener_volumen_por_departamento " +
            "primero) y contribuyente por id (no por nombre — usa listar_contribuyentes primero).",
            propiedades: new JsonObject
            {
                ["anio"] = AnioOpcional(),
                ["mes"] = new JsonObject { ["type"] = new JsonArray { "integer", "null" }, ["description"] = "Mes de 1 a 12. Usa null para no filtrar." },
                ["tipo"] = new JsonObject { ["type"] = new JsonArray { "string", "null" }, ["description"] = "Movilización, Reenvío o Tránsito. Usa null para no filtrar." },
                ["departamentoId"] = new JsonObject { ["type"] = new JsonArray { "integer", "null" }, ["description"] = "Id del departamento de origen. Usa null para no filtrar." },
                ["usuarioId"] = new JsonObject { ["type"] = new JsonArray { "integer", "null" }, ["description"] = "Id del contribuyente. Usa null para no filtrar." },
            },
            requeridas: new JsonArray()),
    };

    private static JsonObject AnioOpcional() => new()
    {
        ["type"] = new JsonArray { "integer", "null" },
        ["description"] = "Año a consultar. Usa null para histórico completo.",
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
    private readonly ICasoUsoObtenerResumenGerencial _obtenerResumenGerencial;
    private readonly ICasoUsoObtenerSerieMensual _obtenerSerieMensual;
    private readonly ICasoUsoObtenerDistribucionPorTipo _obtenerDistribucionPorTipo;
    private readonly ICasoUsoObtenerVolumenPorDepartamento _obtenerVolumenPorDepartamento;
    private readonly ICasoUsoObtenerTopProductos _obtenerTopProductos;
    private readonly ICasoUsoObtenerTopRutas _obtenerTopRutas;
    private readonly ICasoUsoListarContribuyentes _listarContribuyentes;
    private readonly ICasoUsoObtenerResumenContribuyente _obtenerResumenContribuyente;
    private readonly ICasoUsoContarSolicitudes _contarSolicitudes;

    public CasoUsoResponderPreguntaGerencialGroq(
        ClienteChatGroq clienteChat,
        TornaguiaDbContext context,
        ICasoUsoObtenerResumenGerencial obtenerResumenGerencial,
        ICasoUsoObtenerSerieMensual obtenerSerieMensual,
        ICasoUsoObtenerDistribucionPorTipo obtenerDistribucionPorTipo,
        ICasoUsoObtenerVolumenPorDepartamento obtenerVolumenPorDepartamento,
        ICasoUsoObtenerTopProductos obtenerTopProductos,
        ICasoUsoObtenerTopRutas obtenerTopRutas,
        ICasoUsoListarContribuyentes listarContribuyentes,
        ICasoUsoObtenerResumenContribuyente obtenerResumenContribuyente,
        ICasoUsoContarSolicitudes contarSolicitudes)
    {
        _clienteChat = clienteChat;
        _context = context;
        _obtenerResumenGerencial = obtenerResumenGerencial;
        _obtenerSerieMensual = obtenerSerieMensual;
        _obtenerDistribucionPorTipo = obtenerDistribucionPorTipo;
        _obtenerVolumenPorDepartamento = obtenerVolumenPorDepartamento;
        _obtenerTopProductos = obtenerTopProductos;
        _obtenerTopRutas = obtenerTopRutas;
        _listarContribuyentes = listarContribuyentes;
        _obtenerResumenContribuyente = obtenerResumenContribuyente;
        _contarSolicitudes = contarSolicitudes;
    }

    public async Task<ResponderPreguntaGerencialResponse> EjecutarAsync(
        ResponderPreguntaGerencialRequest request, CancellationToken cancellationToken = default)
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
            EjecutarHerramientaAsync,
            cancellationToken);

        _context.MensajesAsistente.AddRange(
            new MensajeAsistente { UsuarioId = request.UsuarioId, ConversacionId = request.ConversacionId, Rol = "usuario", Contenido = request.Pregunta, FechaCreacion = DateTime.UtcNow },
            new MensajeAsistente { UsuarioId = request.UsuarioId, ConversacionId = request.ConversacionId, Rol = "asistente", Contenido = respuestaFinal, FechaCreacion = DateTime.UtcNow });
        await _context.SaveChangesAsync(cancellationToken);

        return new ResponderPreguntaGerencialResponse(respuestaFinal);
    }

    private async Task<string> EjecutarHerramientaAsync(string nombre, string argumentosJson, CancellationToken cancellationToken)
    {
        using var argumentos = JsonDocument.Parse(argumentosJson);
        var raiz = argumentos.RootElement;

        object resultado = nombre switch
        {
            "obtener_resumen_gerencial" => await _obtenerResumenGerencial.EjecutarAsync(LeerIntOpcional(raiz, "anio")),
            "obtener_serie_mensual" => await _obtenerSerieMensual.EjecutarAsync(raiz.GetProperty("anio").GetInt32()),
            "obtener_distribucion_por_tipo" => await _obtenerDistribucionPorTipo.EjecutarAsync(LeerIntOpcional(raiz, "anio")),
            "obtener_volumen_por_departamento" => await _obtenerVolumenPorDepartamento.EjecutarAsync(LeerIntOpcional(raiz, "anio")),
            "obtener_top_productos" => await _obtenerTopProductos.EjecutarAsync(LeerIntOpcional(raiz, "anio")),
            "obtener_top_rutas" => await _obtenerTopRutas.EjecutarAsync(LeerIntOpcional(raiz, "anio")),
            "listar_contribuyentes" => await _listarContribuyentes.EjecutarAsync(LeerIntOpcional(raiz, "anio")),
            "obtener_resumen_contribuyente" => await _obtenerResumenContribuyente.EjecutarAsync(
                raiz.GetProperty("usuarioId").GetInt32(), LeerIntOpcional(raiz, "anio")),
            "contar_solicitudes" => await _contarSolicitudes.EjecutarAsync(new ContarSolicitudesRequest(
                LeerIntOpcional(raiz, "anio"),
                LeerIntOpcional(raiz, "mes"),
                LeerStringOpcional(raiz, "tipo"),
                LeerIntOpcional(raiz, "departamentoId"),
                LeerIntOpcional(raiz, "usuarioId"))),
            _ => throw new InvalidOperationException($"Herramienta desconocida: {nombre}"),
        };

        return JsonSerializer.Serialize(resultado);
    }

    private static int? LeerIntOpcional(JsonElement raiz, string propiedad)
        => raiz.TryGetProperty(propiedad, out var valor) && valor.ValueKind == JsonValueKind.Number
            ? valor.GetInt32()
            : null;

    private static string? LeerStringOpcional(JsonElement raiz, string propiedad)
        => raiz.TryGetProperty(propiedad, out var valor) && valor.ValueKind == JsonValueKind.String
            ? valor.GetString()
            : null;

    private static string RolOpenAi(string rol) => rol == "asistente" ? "assistant" : "user";
}
