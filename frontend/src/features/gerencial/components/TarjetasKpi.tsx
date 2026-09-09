import { formatearMonedaCOP } from '../../../shared/lib/formato'
import type { ResumenGerencial } from '../types'

interface TarjetasKpiProps {
  resumen: ResumenGerencial
}

export function TarjetasKpi({ resumen }: TarjetasKpiProps) {
  const kpis = [
    { label: 'Tornaguías', valor: resumen.totalTornaguias.toLocaleString('es-CO') },
    { label: 'Impuesto total', valor: formatearMonedaCOP(resumen.impuestoTotal) },
    { label: 'Impuesto causado', valor: formatearMonedaCOP(resumen.impuestoCausado) },
    { label: 'Impuesto por causar', valor: formatearMonedaCOP(resumen.impuestoPorCausar) },
    { label: 'Contribuyentes', valor: resumen.totalContribuyentes.toLocaleString('es-CO') },
    { label: 'Bodegas', valor: resumen.totalBodegas.toLocaleString('es-CO') },
    { label: 'Lotes reservados', valor: resumen.lotesReservados.toLocaleString('es-CO') },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-2xl font-bold text-marca-oscuro">{kpi.valor}</p>
          <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
        </div>
      ))}
    </div>
  )
}
