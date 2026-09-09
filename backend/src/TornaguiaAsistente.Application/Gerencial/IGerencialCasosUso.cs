namespace TornaguiaAsistente.Application.Gerencial;

public interface ICasoUsoObtenerResumenGerencial
{
    Task<ResumenGerencialResponse> EjecutarAsync(int? anio);
}

public interface ICasoUsoObtenerSerieMensual
{
    Task<IReadOnlyList<PuntoSerieMensualResponse>> EjecutarAsync(int anio);
}

public interface ICasoUsoObtenerDistribucionPorTipo
{
    Task<IReadOnlyList<DistribucionTipoResponse>> EjecutarAsync(int? anio);
}

public interface ICasoUsoObtenerVolumenPorDepartamento
{
    Task<IReadOnlyList<VolumenDepartamentoResponse>> EjecutarAsync(int? anio);
}

public interface ICasoUsoObtenerTopProductos
{
    Task<IReadOnlyList<TopProductoResponse>> EjecutarAsync(int? anio);
}

public interface ICasoUsoObtenerTopRutas
{
    Task<IReadOnlyList<TopRutaResponse>> EjecutarAsync(int? anio);
}

public interface ICasoUsoListarContribuyentes
{
    Task<IReadOnlyList<ContribuyenteResumenResponse>> EjecutarAsync(int? anio);
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
    decimal ImpuestoCausado,
    decimal ImpuestoPorCausar,
    decimal ImpuestoTotal,
    int TotalContribuyentes,
    int TotalBodegas,
    int LotesReservados,
    IReadOnlyList<int> AniosDisponibles
);

public record PuntoSerieMensualResponse(int Mes, int Tornaguias, decimal Impuesto);

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
    decimal ImpuestoCausado,
    decimal ImpuestoPorCausar,
    IReadOnlyList<DistribucionTipoResponse> PorTipo
);

/// <summary>DepartamentoId, no nombre: con texto libre el modelo del bot podría inventar variantes ("Cundinamarca" vs "CUNDINAMARCA").</summary>
public record ContarSolicitudesRequest(int? Anio, int? Mes, string? Tipo, int? DepartamentoId, int? UsuarioId);

public record ContarSolicitudesResponse(int Cantidad, decimal Impuesto);
