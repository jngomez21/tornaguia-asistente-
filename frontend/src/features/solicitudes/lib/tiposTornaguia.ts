export type TipoTornaguia = 'Movilización' | 'Reenvío' | 'Tránsito'

export const explicacionPorTipo: Record<TipoTornaguia, string> = {
  Movilización:
    'Va de un dpto A a un dpto B, y los productos se declaran en el dpto final. Además, tienen como destino el consumo.',
  Reenvío:
    'Va de un dpto A a un dpto B, y los productos fueron declarados en el dpto origen. Además, tienen como destino el consumo.',
  Tránsito: 'Se queda dentro del mismo departamento, o el destino es otro país / es para exportación.',
}

interface ContextoResultado {
  tipoDestino?: 'municipio' | 'pais'
  esParaExportacion?: boolean
}

/**
 * Explicación en lenguaje llano de un resultado ya confirmado. Reenvío y
 * Movilización tienen una única explicación; Tránsito se distingue en 3
 * subcasos según el destino y si es para exportación (ver
 * docs/negocio/tornaguias-analisis-normativo.md, sección 2).
 */
export function explicarResultado(tipoTornaguia: string, contexto?: ContextoResultado): string {
  if (tipoTornaguia === 'Tránsito') {
    if (contexto?.esParaExportacion) {
      return contexto.tipoDestino === 'pais'
        ? 'Va de un dpto A a otro país, tránsito hacia otro país (exportación).'
        : 'Va de un dpto A a un dpto B con destino exportación.'
    }
    return 'Tránsito dentro de un mismo dpto.'
  }
  return explicacionPorTipo[tipoTornaguia as TipoTornaguia] ?? tipoTornaguia
}
