namespace TornaguiaAsistente.Application.Inventario;

public interface ICasoUsoObtenerResumenImpuestoConsumo
{
    Task<ResumenImpuestoConsumoResponse> EjecutarAsync(int usuarioId);
}

/// <summary>
/// Totales de impuesto al consumo del contribuyente, sin doble conteo: un lote Vinculado ya
/// aporta su valor a traves de la solicitud que lo uso (SolicitudProducto), no del lote en si
/// (por eso solo se cuentan lotes en estado Reservado, los que aun no se movilizaron).
/// </summary>
public record ResumenImpuestoConsumoResponse(
    decimal ImpuestoEnLotesSinUsar,
    decimal ImpuestoYaCausadoEnReenvios,
    decimal ImpuestoPorCausarEnMovilizacionesYTransitos,
    decimal Total
);
