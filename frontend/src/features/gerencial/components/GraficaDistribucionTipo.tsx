import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { colorHexPorTipo } from '../../solicitudes/lib/coloresTornaguia'
import { formatearMonedaCOP } from '../../../shared/lib/formato'
import type { DistribucionTipo } from '../types'

interface GraficaDistribucionTipoProps {
  datos: DistribucionTipo[]
}

function TooltipTipo({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const punto = payload[0].payload as DistribucionTipo
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-marca-oscuro mb-0.5">{punto.tipo}</p>
      <p className="text-gray-600">{punto.cantidad.toLocaleString('es-CO')} tornaguías</p>
      <p className="text-gray-600">{formatearMonedaCOP(punto.impuesto)}</p>
    </div>
  )
}

// Dona en vez de barra: son exactamente 3 categorías (el árbol de reglas no admite una cuarta),
// bien dentro del límite de "parte-del-todo de un vistazo" (≤6 segmentos). Los mismos colores
// que el resto de la app (coloresTornaguia.ts), así el tipo se reconoce igual en cualquier pantalla.
export function GraficaDistribucionTipo({ datos }: GraficaDistribucionTipoProps) {
  const total = datos.reduce((suma, d) => suma + d.cantidad, 0)

  if (total === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-xs text-gray-400">
        Sin solicitudes registradas en este período.
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <ResponsiveContainer width="100%" height={200} className="sm:max-w-[200px]">
        <PieChart>
          <Pie
            data={datos}
            dataKey="cantidad"
            nameKey="tipo"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={datos.filter((d) => d.cantidad > 0).length > 1 ? 2 : 0}
            stroke="#fff"
            strokeWidth={2}
          >
            {datos.map((d) => (
              <Cell key={d.tipo} fill={colorHexPorTipo[d.tipo] ?? '#0B1F4B'} />
            ))}
          </Pie>
          <Tooltip content={TooltipTipo} />
        </PieChart>
      </ResponsiveContainer>

      <ul className="flex-1 w-full space-y-2">
        {datos.map((d) => (
          <li key={d.tipo} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: colorHexPorTipo[d.tipo] ?? '#0B1F4B' }}
              />
              <span className="text-gray-700 truncate">{d.tipo}</span>
            </span>
            <span className="text-marca-oscuro font-semibold shrink-0">
              {d.cantidad.toLocaleString('es-CO')} · {total > 0 ? Math.round((d.cantidad / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
