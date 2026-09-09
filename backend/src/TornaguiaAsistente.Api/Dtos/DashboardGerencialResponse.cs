using TornaguiaAsistente.Application.Gerencial;

namespace TornaguiaAsistente.Api.Dtos;

/// <summary>
/// El tablero pide una sola vez y recibe todo, en vez de ocho llamadas con ocho estados de carga
/// que pueden desalinearse si el usuario cambia el filtro de año a mitad de carga.
/// </summary>
public record DashboardGerencialResponse(
    ResumenGerencialResponse Resumen,
    IReadOnlyList<PuntoSerieMensualResponse> SerieMensual,
    IReadOnlyList<DistribucionTipoResponse> DistribucionPorTipo,
    IReadOnlyList<VolumenDepartamentoResponse> VolumenPorDepartamento,
    IReadOnlyList<TopProductoResponse> TopProductos,
    IReadOnlyList<TopRutaResponse> TopRutas,
    IReadOnlyList<ContribuyenteResumenResponse> Contribuyentes
);
