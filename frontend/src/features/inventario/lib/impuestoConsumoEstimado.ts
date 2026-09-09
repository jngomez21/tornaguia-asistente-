/**
 * Espejo en frontend de Domain/Impuestos/ImpuestoConsumo.cs, solo para mostrar un estimado en
 * vivo mientras se arma un lote nuevo (sin declaración). El valor real siempre lo calcula y
 * persiste el backend al crear el lote; esto nunca se envía en el request.
 */
const VALOR_POR_UNIDAD_POR_DEFECTO = 1300

export function calcularImpuestoEstimado(cantidad: number): number {
  return Number.isFinite(cantidad) && cantidad > 0 ? cantidad * VALOR_POR_UNIDAD_POR_DEFECTO : 0
}
