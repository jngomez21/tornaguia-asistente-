import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import type { TopRuta } from '../types'

const COLOR_BARRA = '#1E88C7' // marca-medio

interface TopRutasProps {
  datos: TopRuta[]
}

function etiquetaRuta(ruta: TopRuta): string {
  return `${ruta.origen} → ${ruta.destino}`
}

function TooltipRuta({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const punto = payload[0].payload as TopRuta
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-marca-oscuro mb-0.5">{etiquetaRuta(punto)}</p>
      <p className="text-gray-600">{punto.cantidad.toLocaleString('es-CO')} tornaguías</p>
    </div>
  )
}

export function TopRutas({ datos }: TopRutasProps) {
  if (datos.length === 0) {
    return (
      <div className="h-[160px] flex items-center justify-center text-xs text-gray-400">
        Sin rutas registradas en este período.
      </div>
    )
  }

  const puntos = datos.map((d) => ({ ...d, ruta: etiquetaRuta(d) }))
  const altura = Math.max(puntos.length * 34, 120)

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={puntos} layout="vertical" margin={{ top: 4, right: 32, left: 8, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#e5e7eb" />
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="ruta"
          width={170}
          tick={{ fontSize: 11, fill: '#52514e' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={TooltipRuta} cursor={{ fill: '#f3f4f6' }} />
        <Bar dataKey="cantidad" fill={COLOR_BARRA} radius={[0, 4, 4, 0]} maxBarSize={20}>
          <LabelList dataKey="cantidad" position="right" style={{ fontSize: 11, fill: '#52514e' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
