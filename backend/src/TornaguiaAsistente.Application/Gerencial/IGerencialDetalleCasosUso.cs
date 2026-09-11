namespace TornaguiaAsistente.Application.Gerencial;

// Nivel de detalle del asistente gerencial: separado de IGerencialCasosUso.cs (los agregados)
// para que ese archivo no crezca sin control. Sigue la misma escalera en todos los casos:
// agregado -> lista filtrada/ordenada/acotada con ids -> detalle de un elemento.

public interface ICasoUsoListarSolicitudesGerencial
{
    Task<IReadOnlyList<SolicitudResumenGerencialResponse>> EjecutarAsync(ListarSolicitudesGerencialRequest request);
}

public interface ICasoUsoObtenerSolicitudDetalleGerencial
{
    Task<SolicitudDetalleGerencialResponse> EjecutarAsync(int solicitudId);
}

public interface ICasoUsoListarLotesGerencial
{
    /// <summary>usuarioId = null → todos los contribuyentes. estado = null → cualquier estado.</summary>
    Task<IReadOnlyList<LoteGerencialResponse>> EjecutarAsync(int? usuarioId = null, int? bodegaId = null, string? estado = null);
}

public interface ICasoUsoListarDeclaraciones
{
    /// <summary>
    /// usuarioId = null → todas. Con valor, el dueño se alcanza por Lote → Bodega → Usuario, así
    /// que las declaraciones que aún no se vincularon a un lote (o cuyo lote no tiene bodega) no
    /// tienen dueño y quedan fuera del filtro: solo aparecen al listar sin filtrar por usuario.
    /// </summary>
    Task<IReadOnlyList<DeclaracionResumenResponse>> EjecutarAsync(int? anio = null, int? departamentoId = null, int? usuarioId = null);
}

public interface ICasoUsoObtenerDocumentoDeclaracion
{
    Task<DocumentoResponse> EjecutarAsync(int declaracionId);
}

public record DocumentoResponse(byte[] Bytes, string NombreArchivo, string ContentType);

public record ListarSolicitudesGerencialRequest(
    int? UsuarioId,
    int? Anio,
    string? Tipo,
    int? DepartamentoId,
    string OrdenarPor,
    int Limite
);

public record SolicitudResumenGerencialResponse(
    int SolicitudId,
    DateTime Fecha,
    string Tipo,
    string ContribuyenteNombre,
    string Origen,
    string Destino,
    decimal ValorImpuestoTotal,
    // También en el listado, no solo en el detalle: si el bot no sabe aquí cuáles tienen PDF, el
    // camino de menor resistencia es emitir el enlace sin comprobarlo y que el botón falle.
    bool TienePdf
);

public record LineaProductoResponse(int ProductoId, string ProductoNombre, decimal Cantidad, decimal ValorImpuestoConsumo);

public record DatosTransporteResponse(
    string RemitenteNombre,
    string DestinatarioNombre,
    string TransportadorNombre,
    string PlacaVehiculo,
    DateTime FechaGeneracion
);

public record SolicitudDetalleGerencialResponse(
    int SolicitudId, DateTime Fecha, string Tipo, string ContribuyenteNombre,
    string Origen, string Destino, bool EstaDeclarado, bool EsParaExportacion,
    string? NumeroDeclaracionOrigen, string Justificacion,
    double? DistanciaKm, int? TiempoEstimadoMinutos, bool EsAproximada,
    IReadOnlyList<string>? DepartamentosIntermedios,
    // Lo que faltaba para bajar de agregado a fila: las líneas de producto de esta tornaguía.
    IReadOnlyList<LineaProductoResponse> Productos,
    DatosTransporteResponse? Transporte,
    // Nunca los bytes del PDF — ver Fase 3 del plan: agotaría el contexto del modelo.
    bool TienePdf
);

public record LoteGerencialResponse(
    int LoteId,
    string Estado,
    DateTime FechaCreacion,
    string BodegaNombre,
    IReadOnlyList<LineaProductoResponse> Productos,
    string? NumeroDeclaracion
);

public record DeclaracionResumenResponse(
    int DeclaracionId,
    string NumeroDeclaracion,
    string DepartamentoNombre,
    string Periodo,
    string RemitenteNombre,
    DateTime FechaCarga,
    bool TieneDocumento
);
