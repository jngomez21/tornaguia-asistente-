namespace TornaguiaAsistente.Domain.Impuestos;

/// <summary>
/// Valor de impuesto al consumo simulado por el sistema (no corresponde a tarifas reales de
/// licores/cigarrillos/cervezas): se usa como marcador de negocio consistente para lotes que
/// aun no tienen una declaracion departamental que fije el valor real ya causado.
/// </summary>
public static class ImpuestoConsumo
{
    public const decimal ValorPorUnidadPorDefecto = 1300m;

    public static decimal CalcularValorLinea(decimal cantidad) => cantidad * ValorPorUnidadPorDefecto;
}
