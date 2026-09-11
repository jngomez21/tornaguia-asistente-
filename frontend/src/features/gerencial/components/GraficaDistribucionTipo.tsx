import { colorHexPorTipo } from '../../solicitudes/lib/coloresTornaguia'
import { formatearMonedaCOP } from '../../../shared/lib/formato'
import type { DistribucionTipo } from '../types'

interface GraficaDistribucionTipoProps {
  datos: DistribucionTipo[]
}

const COLOR_POR_DEFECTO = '#0B1F4B' // marca-oscuro

/**
 * Barra apilada de una línea en vez de dona con panel propio: son 3 categorías (el árbol de reglas
 * no admite una cuarta) y la dona gastaba ~450px de alto en una tarjeta con mucho blanco. Apilada
 * dice lo mismo —la proporción parte-del-todo— en ~80px, y deja sitio para el impuesto de cada
 * tipo, que antes solo aparecía al pasar el mouse. Mismos colores que el resto de la app.
 */
export function GraficaDistribucionTipo({ datos }: GraficaDistribucionTipoProps) {
  const total = datos.reduce((suma, d) => suma + d.cantidad, 0)

  if (total === 0) {
    return <p className="text-xs text-gray-400">Sin solicitudes registradas en este período.</p>
  }

  const porcentaje = (cantidad: number) => (cantidad / total) * 100

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        {datos
          .filter((d) => d.cantidad > 0)
          .map((d) => (
            <div
              key={d.tipo}
              title={`${d.tipo}: ${d.cantidad.toLocaleString('es-CO')} (${Math.round(porcentaje(d.cantidad))}%)`}
              style={{
                width: `${porcentaje(d.cantidad)}%`,
                backgroundColor: colorHexPorTipo[d.tipo] ?? COLOR_POR_DEFECTO,
              }}
            />
          ))}
      </div>

      <ul className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
        {datos.map((d) => (
          <li key={d.tipo} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: colorHexPorTipo[d.tipo] ?? COLOR_POR_DEFECTO }}
            />
            <span className="text-gray-600">{d.tipo}</span>
            <span className="font-semibold text-marca-oscuro tabular-nums">
              {d.cantidad.toLocaleString('es-CO')} · {Math.round(porcentaje(d.cantidad))}%
            </span>
            <span className="text-gray-400 tabular-nums">{formatearMonedaCOP(d.impuesto)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
