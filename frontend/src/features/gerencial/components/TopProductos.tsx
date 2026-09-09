import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { formatearMonedaCOP } from '../../../shared/lib/formato'
import type { TopProducto } from '../types'

const COLOR_BARRA = '#1E88C7' // marca-medio

interface TopProductosProps {
  datos: TopProducto[]
}

function TooltipProducto({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const punto = payload[0].payload as TopProducto
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-marca-oscuro mb-0.5">{punto.productoNombre}</p>
      <p className="text-gray-600">{formatearMonedaCOP(punto.impuesto)}</p>
      <p className="text-gray-600">{punto.unidades.toLocaleString('es-CO')} unidades</p>
    </div>
  )
}

export function TopProductos({ datos }: TopProductosProps) {
  if (datos.length === 0) {
    return (
      <div className="h-[160px] flex items-center justify-center text-xs text-gray-400">
        Sin productos movilizados en este período.
      </div>
    )
  }

  const altura = Math.max(datos.length * 34, 120)

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#e5e7eb" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="productoNombre"
          width={140}
          tick={{ fontSize: 11, fill: '#52514e' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={TooltipProducto} cursor={{ fill: '#f3f4f6' }} />
        <Bar dataKey="impuesto" fill={COLOR_BARRA} radius={[0, 4, 4, 0]} maxBarSize={20}>
          <LabelList
            dataKey="impuesto"
            position="right"
            formatter={(v) => (typeof v === 'number' ? formatearMonedaCOP(v) : '')}
            style={{ fontSize: 11, fill: '#52514e' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
