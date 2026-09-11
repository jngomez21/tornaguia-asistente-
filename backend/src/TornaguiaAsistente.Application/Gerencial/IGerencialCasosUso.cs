namespace TornaguiaAsistente.Application.Gerencial;

/// <summary>
/// Un departamento puede mirarse como origen (tráfico: de ahí sale la tornaguía, el origen es "el
/// distribuidor") o como destino fiscal (consumo/recaudo: en Movilización se causa allá, y en
/// Reenvío la ley cruza ahí el impuesto ya pagado en origen). No es una preferencia del usuario del
/// tablero — es una regla de negocio fija: cualquier cantidad de tornaguías siempre se atribuye al
/// origen, cualquier valor de impuesto siempre al destino. Por eso no aparece como parámetro
/// público en los casos de uso: cada uno la aplica internamente según qué está calculando — ver
/// ImpuestoConsumoQueries para la regla completa.
/// </summary>
public enum CriterioDepartamento
{
    Origen,
    Destino,
}

public interface ICasoUsoObtenerResumenGerencial
{
    /// <summary>departamentoId = null → nacional.</summary>
    Task<ResumenGerencialResponse> EjecutarAsync(int? anio, int? departamentoId = null);
}

public interface ICasoUsoObtenerSerieMensual
{
    /// <summary>
    /// anio = null → histórico completo (un punto por cada mes con datos, sin acotar a 12).
    /// departamentoId = null → nacional.
    /// </summary>
    Task<IReadOnlyList<PuntoSerieMensualResponse>> EjecutarAsync(int? anio, int? departamentoId = null);
}

public interface ICasoUsoObtenerDistribucionPorTipo
{
    /// <summary>departamentoId = null → nacional.</summary>
    Task<IReadOnlyList<DistribucionTipoResponse>> EjecutarAsync(int? anio, int? departamentoId = null);
}

public interface ICasoUsoObtenerVolumenPorDepartamento
{
    Task<IReadOnlyList<VolumenDepartamentoResponse>> EjecutarAsync(int? anio);
}

public interface ICasoUsoObtenerTopProductos
{
    /// <summary>
    /// limite = null → todos (el tablero filtra/ordena en el cliente); el bot pasa un tope para no
    /// inflar su contexto. departamentoId = null → sin acotar geográficamente.
    /// </summary>
    Task<IReadOnlyList<TopProductoResponse>> EjecutarAsync(int? anio, int? limite = null, int? departamentoId = null);
}

public interface ICasoUsoObtenerTopRutas
{
    /// <summary>
    /// limite = null → todas (el tablero filtra/ordena en el cliente); el bot pasa un tope para no
    /// inflar su contexto. departamentoId = null → sin acotar geográficamente.
    /// </summary>
    Task<IReadOnlyList<TopRutaResponse>> EjecutarAsync(int? anio, int? limite = null, int? departamentoId = null);
}

public interface ICasoUsoListarContribuyentes
{
    /// <summary>
    /// limite = null → todos (para la tabla del tablero); el bot pasa un tope para no inflar su
    /// contexto. departamentoId = null → sin acotar geográficamente; cuando sí se acota, solo
    /// aparecen contribuyentes con tráfico de salida ahí (Tornaguias > 0) — el Impuesto de esa
    /// misma fila es el que fiscalmente les llegó por destino, puede ser 0 aunque Tornaguias no lo sea.
    /// </summary>
    Task<IReadOnlyList<ContribuyenteResumenResponse>> EjecutarAsync(int? anio, int? limite = null, int? departamentoId = null);
}

public interface ICasoUsoObtenerResumenContribuyente
{
    Task<ResumenContribuyenteResponse> EjecutarAsync(int usuarioId, int? anio);
}

public interface ICasoUsoContarSolicitudes
{
    Task<ContarSolicitudesResponse> EjecutarAsync(ContarSolicitudesRequest request);
}

/// <summary>Vista global del sistema (todos los contribuyentes), opcionalmente acotada a un año.</summary>
public record ResumenGerencialResponse(
    int TotalTornaguias,
    // Recaudado: todo lo ya asociado a una tornaguía emitida (Movilización, Reenvío o Tránsito) —
    // el proceso legal que causa el impuesto en el departamento destino es externo al proyecto y
    // se asume ya resuelto, así que aquí no hay un estado "pendiente" para eso.
    decimal ImpuestoRecaudado,
    // Por causar: el valor de los lotes reservados que aún no se han asociado a ninguna
    // tornaguía — "productos quietos" en bodega, no impuesto de una solicitud ya emitida.
    decimal ImpuestoPorCausar,
    decimal ImpuestoEnTornaguias,
    int TotalContribuyentes,
    int TotalBodegas,
    int LotesReservados,
    IReadOnlyList<int> AniosDisponibles
);

public record PuntoSerieMensualResponse(int Anio, int Mes, int Tornaguias, decimal Impuesto);

public record DistribucionTipoResponse(string Tipo, int Cantidad, decimal Impuesto);

public record VolumenDepartamentoResponse(int DepartamentoId, string CodigoDane, string Nombre, int Cantidad, decimal Impuesto);

public record TopProductoResponse(int ProductoId, string ProductoNombre, decimal Impuesto, decimal Unidades);

public record TopRutaResponse(string Origen, string Destino, int Cantidad);

/// <summary>Fila de la tabla de contribuyentes. Deliberadamente sin correo: no es PII que el bot gerencial deba manejar.</summary>
public record ContribuyenteResumenResponse(int UsuarioId, string Nombre, int Tornaguias, decimal Impuesto, DateTime? UltimaActividad);

public record ResumenContribuyenteResponse(
    int UsuarioId,
    string Nombre,
    int TotalBodegas,
    int LotesReservados,
    decimal ImpuestoRecaudado,
    decimal ImpuestoPorCausar,
    IReadOnlyList<DistribucionTipoResponse> PorTipo
);

/// <summary>DepartamentoId, no nombre: con texto libre el modelo del bot podría inventar variantes ("Cundinamarca" vs "CUNDINAMARCA").</summary>
public record ContarSolicitudesRequest(int? Anio, int? Mes, string? Tipo, int? DepartamentoId, int? UsuarioId);

public record ContarSolicitudesResponse(int Cantidad, decimal Impuesto);
