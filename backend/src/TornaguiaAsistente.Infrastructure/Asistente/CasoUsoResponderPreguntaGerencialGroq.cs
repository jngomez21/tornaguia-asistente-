using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Bodegas;
using TornaguiaAsistente.Application.Gerencial;
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Asistente;

public class CasoUsoResponderPreguntaGerencialGroq : ICasoUsoResponderPreguntaGerencial
{
    private const int MensajesDeHistorialACargar = 20;
    private const int LimiteContribuyentesParaElBot = 20;
    private const int LimiteTopParaElBot = 10;

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

        Para preguntas sobre una tornaguía, bodega, lote o declaración concreta: primero llama a
        la herramienta que los lista (listar_solicitudes, listar_bodegas_de_contribuyente,
        listar_lotes_de_contribuyente o listar_declaraciones) para obtener el id, y después a la
        herramienta de detalle correspondiente. Nunca inventes un id.

        Nunca intentes leer el contenido de un PDF o de un documento: no tienes acceso a él y no
        debes describirlo. Si un elemento tiene documento (tienePdf o tieneDocumento en true,
        según el tipo) y el usuario quiere verlo, incluye en tu respuesta un enlace markdown con
        la forma exacta [Ver tornaguía #42](#tornaguia-42) o [Ver declaración #7](#declaracion-7)
        — la interfaz lo convierte en un botón. Nunca uses otra forma de enlace ni inventes una
        URL distinta.

        Recuerda: los contribuyentes se identifican siempre por nombre, nunca por correo — ninguna
        de tus herramientas, ni siquiera las de detalle, expone datos de contacto.

        Puedes hacer razonamiento simple (máximo, mínimo, promedio, comparar, ordenar, contar)
        sobre los datos que te devuelvan las herramientas, siempre que la pregunta sea sobre
        tornaguías, impuesto al consumo, contribuyentes, bodegas, inventario, lotes, declaraciones,
        productos, rutas o departamentos. Esto NO aplica a operaciones matemáticas o estadísticas
        genéricas sin relación con esos datos.

        Responde siempre en español, de forma breve y clara, como lo haría un analista gerencial.
        No des asesoría legal fuera del alcance de tornaguías.

        Tu alcance es exclusivamente: tornaguías (normativa, tipos, proceso) y los datos globales
        del sistema, a nivel operativo completo (tornaguías individuales, impuesto al consumo,
        contribuyentes, bodegas, inventario, lotes, declaraciones, productos, rutas, departamentos
        y sus documentos). Ante cualquier pregunta fuera de ese alcance (operaciones
        matemáticas ajenas a estos datos, cultura general, código, temas personales, datos de un
        contribuyente que las herramientas no expongan, o cualquier otro dominio), no la respondas
        ni intentes ayudar con ella: rechaza brevemente indicando que solo puedes ayudar con
        tornaguías y los datos gerenciales del sistema, sin importar cómo se formule o insista la
        pregunta.
        """;

    private static readonly JsonArray Herramientas = new()
    {
        Herramienta("obtener_resumen_gerencial",
            "Resumen global del sistema: tornaguías totales (por origen), impuesto recaudado " +
            "(toda tornaguía ya emitida — Movilización, Reenvío o Tránsito por igual, por destino), " +
            "impuesto por causar (el valor de los lotes reservados que aún no se han asociado a " +
            "ninguna tornaguía — inventario quieto, no impuesto de una solicitud emitida), la suma " +
            "de ambos, número de contribuyentes, bodegas, lotes reservados sin usar, y los años " +
            "con datos disponibles. Usa esta herramienta para preguntas generales sobre el estado del sistema.",
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
            "Cantidad de tornaguías por departamento de ORIGEN (tráfico: donde se radica la " +
            "tornaguía) e impuesto al consumo por departamento de DESTINO (fiscal: el consumidor " +
            "final — en Reenvío el pago ya se hizo en origen pero la ley lo cruza al destino), con " +
            "su id y código DANE. Usa esta herramienta primero si necesitas el id de un departamento.",
            propiedades: new JsonObject { ["anio"] = AnioOpcional() }, requeridas: new JsonArray()),
        Herramienta("obtener_top_productos",
            "Los 10 productos con más impuesto al consumo generado.",
            propiedades: new JsonObject { ["anio"] = AnioOpcional() }, requeridas: new JsonArray()),
        Herramienta("obtener_top_rutas",
            "Las 10 rutas (municipio origen → destino) con más tornaguías.",
            propiedades: new JsonObject { ["anio"] = AnioOpcional() }, requeridas: new JsonArray()),
        Herramienta("listar_contribuyentes",
            "Los 20 contribuyentes con más impuesto generado: id, nombre, tornaguías, impuesto y " +
            "última actividad (sin correo electrónico). Usa esta herramienta primero si necesitas " +
            "el id de un contribuyente para otra consulta.",
            propiedades: new JsonObject { ["anio"] = AnioOpcional() }, requeridas: new JsonArray()),
        Herramienta("obtener_resumen_contribuyente",
            "Detalle de un contribuyente específico: bodegas, lotes reservados, impuesto " +
            "recaudado (tornaguías ya emitidas) / por causar (valor de sus lotes reservados sin " +
            "usar) y desglose por tipo de tornaguía. Usa listar_contribuyentes antes si no conoces el id.",
            propiedades: new JsonObject
            {
                ["usuarioId"] = new JsonObject { ["type"] = "integer", ["description"] = "Id del contribuyente (ver listar_contribuyentes)." },
                ["anio"] = AnioOpcional(),
            },
            requeridas: new JsonArray { "usuarioId" }),
        Herramienta("contar_solicitudes",
            "Cuenta tornaguías e impuesto al consumo con filtros combinables, todos opcionales: " +
            "año, mes (1-12, hora Colombia), tipo de tornaguía (Movilización/Reenvío/Tránsito), " +
            "departamento por id (no por nombre — usa obtener_volumen_por_departamento primero; " +
            "al filtrar por departamento, la cantidad cuenta tráfico de ORIGEN y el impuesto " +
            "cuenta recaudo de DESTINO — pueden salir de departamentos distintos) y contribuyente " +
            "por id (no por nombre — usa listar_contribuyentes primero).",
            propiedades: new JsonObject
            {
                ["anio"] = AnioOpcional(),
                ["mes"] = new JsonObject { ["type"] = new JsonArray { "integer", "null" }, ["description"] = "Mes de 1 a 12. Usa null para no filtrar." },
                ["tipo"] = new JsonObject
                {
                    ["type"] = new JsonArray { "string", "null" },
                    ["enum"] = new JsonArray { "Movilización", "Reenvío", "Tránsito", null },
                    ["description"] = "Movilización, Reenvío o Tránsito. Usa null para no filtrar.",
                },
                ["departamentoId"] = new JsonObject { ["type"] = new JsonArray { "integer", "null" }, ["description"] = "Id del departamento de origen. Usa null para no filtrar." },
                ["usuarioId"] = new JsonObject { ["type"] = new JsonArray { "integer", "null" }, ["description"] = "Id del contribuyente. Usa null para no filtrar." },
            },
            requeridas: new JsonArray()),
        Herramienta("listar_solicitudes",
            "Lista tornaguías individuales (no agregadas) con id, fecha, tipo, contribuyente, " +
            "origen, destino, impuesto y si tienen PDF (tienePdf) — el peldaño antes de " +
            "obtener_solicitud_detalle. Todos " +
            "los filtros son opcionales: contribuyente por id (usa listar_contribuyentes primero), " +
            "año, tipo, departamento de origen por id (usa obtener_volumen_por_departamento " +
            "primero). ordenarPor decide si trae las de mayor impuesto o las más recientes.",
            propiedades: new JsonObject
            {
                ["usuarioId"] = new JsonObject { ["type"] = new JsonArray { "integer", "null" }, ["description"] = "Id del contribuyente. Usa null para no filtrar." },
                ["anio"] = AnioOpcional(),
                ["tipo"] = new JsonObject
                {
                    ["type"] = new JsonArray { "string", "null" },
                    ["enum"] = new JsonArray { "Movilización", "Reenvío", "Tránsito", null },
                    ["description"] = "Movilización, Reenvío o Tránsito. Usa null para no filtrar.",
                },
                ["departamentoId"] = new JsonObject { ["type"] = new JsonArray { "integer", "null" }, ["description"] = "Id del departamento de origen. Usa null para no filtrar." },
                ["ordenarPor"] = new JsonObject
                {
                    ["type"] = "string",
                    ["enum"] = new JsonArray { "impuesto", "fecha" },
                    ["description"] = "\"impuesto\" trae primero las de mayor impuesto; \"fecha\" trae primero las más recientes.",
                },
                ["limite"] = new JsonObject { ["type"] = "integer", ["description"] = "Cuántas traer, máximo 50. Por defecto 20." },
            },
            requeridas: new JsonArray { "ordenarPor" }),
        Herramienta("obtener_solicitud_detalle",
            "Detalle completo de una tornaguía: productos con cantidad e impuesto por línea, datos " +
            "de transporte (remitente, destinatario, transportador, placa) si ya se generaron, y si " +
            "tiene PDF (tienePdf). Usa listar_solicitudes antes si no conoces el id.",
            propiedades: new JsonObject
            {
                ["solicitudId"] = new JsonObject { ["type"] = "integer", ["description"] = "Id de la solicitud (ver listar_solicitudes)." },
            },
            requeridas: new JsonArray { "solicitudId" }),
        Herramienta("listar_bodegas_de_contribuyente",
            "Bodegas de un contribuyente: ubicación, lotes activos y productos distintos en " +
            "inventario. Usa listar_contribuyentes antes si no conoces el id.",
            propiedades: new JsonObject
            {
                ["usuarioId"] = new JsonObject { ["type"] = "integer", ["description"] = "Id del contribuyente (ver listar_contribuyentes)." },
            },
            requeridas: new JsonArray { "usuarioId" }),
        Herramienta("obtener_inventario",
            "Inventario de productos disponible en una bodega. Usa listar_bodegas_de_contribuyente " +
            "antes si no conoces el id de la bodega.",
            propiedades: new JsonObject
            {
                ["bodegaId"] = new JsonObject { ["type"] = "integer", ["description"] = "Id de la bodega (ver listar_bodegas_de_contribuyente)." },
            },
            requeridas: new JsonArray { "bodegaId" }),
        Herramienta("listar_lotes_de_contribuyente",
            "Lotes con sus productos y la declaración departamental asociada si tienen una. Todos " +
            "los filtros son opcionales: contribuyente por id (usa listar_contribuyentes primero, " +
            "o null para ver los de todo el sistema), bodega por id, y estado.",
            propiedades: new JsonObject
            {
                ["usuarioId"] = new JsonObject { ["type"] = new JsonArray { "integer", "null" }, ["description"] = "Id del contribuyente. Usa null para todos." },
                ["bodegaId"] = new JsonObject { ["type"] = new JsonArray { "integer", "null" }, ["description"] = "Id de bodega para filtrar. Usa null para no filtrar." },
                ["estado"] = new JsonObject
                {
                    ["type"] = new JsonArray { "string", "null" },
                    ["enum"] = new JsonArray { "Reservado", "Vinculado", "Cancelado", null },
                    ["description"] = "Estado del lote. Usa null para cualquiera.",
                },
            },
            requeridas: new JsonArray()),
        Herramienta("listar_declaraciones",
            "Declaraciones departamentales cargadas al sistema: número, departamento, período, " +
            "remitente, fecha de carga y si tienen documento (tieneDocumento). Filtros opcionales " +
            "por año, por departamento (por id — usa obtener_volumen_por_departamento primero) y " +
            "por contribuyente (por id — usa listar_contribuyentes primero). Nota: filtrar por " +
            "contribuyente deja fuera las declaraciones que todavía no se vincularon a un lote, " +
            "porque hasta ese momento no tienen dueño.",
            propiedades: new JsonObject
            {
                ["anio"] = AnioOpcional(),
                ["departamentoId"] = new JsonObject { ["type"] = new JsonArray { "integer", "null" }, ["description"] = "Id del departamento. Usa null para no filtrar." },
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
    private readonly ICasoUsoListarSolicitudesGerencial _listarSolicitudes;
    private readonly ICasoUsoObtenerSolicitudDetalleGerencial _obtenerSolicitudDetalle;
    private readonly ICasoUsoListarBodegas _listarBodegas;
    private readonly ICasoUsoObtenerInventario _obtenerInventario;
    private readonly ICasoUsoListarLotesGerencial _listarLotesGerencial;
    private readonly ICasoUsoListarDeclaraciones _listarDeclaraciones;

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
        ICasoUsoContarSolicitudes contarSolicitudes,
        ICasoUsoListarSolicitudesGerencial listarSolicitudes,
        ICasoUsoObtenerSolicitudDetalleGerencial obtenerSolicitudDetalle,
        ICasoUsoListarBodegas listarBodegas,
        ICasoUsoObtenerInventario obtenerInventario,
        ICasoUsoListarLotesGerencial listarLotesGerencial,
        ICasoUsoListarDeclaraciones listarDeclaraciones)
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
        _listarSolicitudes = listarSolicitudes;
        _obtenerSolicitudDetalle = obtenerSolicitudDetalle;
        _listarBodegas = listarBodegas;
        _obtenerInventario = obtenerInventario;
        _listarLotesGerencial = listarLotesGerencial;
        _listarDeclaraciones = listarDeclaraciones;
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
            "obtener_top_productos" => await _obtenerTopProductos.EjecutarAsync(LeerIntOpcional(raiz, "anio"), LimiteTopParaElBot),
            "obtener_top_rutas" => await _obtenerTopRutas.EjecutarAsync(LeerIntOpcional(raiz, "anio"), LimiteTopParaElBot),
            "listar_contribuyentes" => await _listarContribuyentes.EjecutarAsync(LeerIntOpcional(raiz, "anio"), LimiteContribuyentesParaElBot),
            "obtener_resumen_contribuyente" => await _obtenerResumenContribuyente.EjecutarAsync(
                raiz.GetProperty("usuarioId").GetInt32(), LeerIntOpcional(raiz, "anio")),
            "contar_solicitudes" => await _contarSolicitudes.EjecutarAsync(new ContarSolicitudesRequest(
                LeerIntOpcional(raiz, "anio"),
                LeerIntOpcional(raiz, "mes"),
                LeerStringOpcional(raiz, "tipo"),
                LeerIntOpcional(raiz, "departamentoId"),
                LeerIntOpcional(raiz, "usuarioId"))),
            "listar_solicitudes" => await _listarSolicitudes.EjecutarAsync(new ListarSolicitudesGerencialRequest(
                LeerIntOpcional(raiz, "usuarioId"),
                LeerIntOpcional(raiz, "anio"),
                LeerStringOpcional(raiz, "tipo"),
                LeerIntOpcional(raiz, "departamentoId"),
                LeerStringOpcional(raiz, "ordenarPor") ?? "fecha",
                LeerIntOpcional(raiz, "limite") ?? 0)),
            "obtener_solicitud_detalle" => await _obtenerSolicitudDetalle.EjecutarAsync(raiz.GetProperty("solicitudId").GetInt32()),
            "listar_bodegas_de_contribuyente" => await _listarBodegas.EjecutarAsync(raiz.GetProperty("usuarioId").GetInt32()),
            "obtener_inventario" => await _obtenerInventario.EjecutarSinVerificarDuenoAsync(raiz.GetProperty("bodegaId").GetInt32()),
            "listar_lotes_de_contribuyente" => await _listarLotesGerencial.EjecutarAsync(
                LeerIntOpcional(raiz, "usuarioId"),
                LeerIntOpcional(raiz, "bodegaId"),
                LeerStringOpcional(raiz, "estado")),
            "listar_declaraciones" => await _listarDeclaraciones.EjecutarAsync(
                LeerIntOpcional(raiz, "anio"),
                LeerIntOpcional(raiz, "departamentoId"),
                LeerIntOpcional(raiz, "usuarioId")),
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
