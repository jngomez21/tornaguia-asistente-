import { formatearMonedaCOP, formatearMonedaCompacta } from '../../../shared/lib/formato'
import type { ResumenGerencial } from '../types'

interface TarjetasKpiProps {
  resumen: ResumenGerencial
}

interface Kpi {
  label: string
  valor: string
  /** Valor exacto para el tooltip nativo cuando el visible va en notación compacta. */
  titulo?: string
  destacado?: boolean
}

/**
 * Tira de una sola fila en pantallas anchas. En un grid de 4 columnas los 7 KPIs ocupaban dos
 * filas (~200px de alto) y dejaban un hueco en la segunda, porque 7 no divide a 4. Los montos van
 * en millones con el valor exacto en el `title`: es lo único que cabe en una columna de ~140px.
 * "Impuesto recaudado" va destacado para que el tablero tenga un punto de entrada visual: el
 * tablero gerencial es la vista de cuánto se ha recaudado, a nivel país o por departamento.
 */
export function TarjetasKpi({ resumen }: TarjetasKpiProps) {
  const kpis: Kpi[] = [
    { label: 'Tornaguías', valor: resumen.totalTornaguias.toLocaleString('es-CO') },
    {
      label: 'Impuesto recaudado',
      valor: formatearMonedaCompacta(resumen.impuestoRecaudado),
      titulo: formatearMonedaCOP(resumen.impuestoRecaudado),
      destacado: true,
    },
    {
      label: 'Impuesto por causar',
      valor: formatearMonedaCompacta(resumen.impuestoPorCausar),
      titulo: formatearMonedaCOP(resumen.impuestoPorCausar),
    },
    {
      label: 'Impuesto en tornaguías',
      valor: formatearMonedaCompacta(resumen.impuestoEnTornaguias),
      titulo: formatearMonedaCOP(resumen.impuestoEnTornaguias),
    },
    { label: 'Contribuyentes', valor: resumen.totalContribuyentes.toLocaleString('es-CO') },
    { label: 'Bodegas', valor: resumen.totalBodegas.toLocaleString('es-CO') },
    { label: 'Lotes reservados', valor: resumen.lotesReservados.toLocaleString('es-CO') },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className={`rounded-xl border p-3 shadow-sm ${
            kpi.destacado ? 'bg-marca-oscuro border-marca-oscuro' : 'bg-white border-gray-200'
          }`}
        >
          <p className={`text-[11px] truncate ${kpi.destacado ? 'text-white/70' : 'text-gray-500'}`}>{kpi.label}</p>
          <p
            title={kpi.titulo}
            className={`mt-1 text-lg font-bold tabular-nums truncate ${
              kpi.destacado ? 'text-white' : 'text-marca-oscuro'
            }`}
          >
            {kpi.valor}
          </p>
        </div>
      ))}
    </div>
  )
}
