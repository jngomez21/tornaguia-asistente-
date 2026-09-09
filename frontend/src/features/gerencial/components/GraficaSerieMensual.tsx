import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { formatearMonedaCOP } from '../../../shared/lib/formato'
import type { PuntoSerieMensual } from '../types'

const NOMBRES_MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const COLOR_TORNAGUIAS = '#1E88C7' // marca-medio
const COLOR_IMPUESTO = '#2FA84F' // marca-verde

interface GraficaSerieMensualProps {
  datos: PuntoSerieMensual[]
}

function TooltipCantidad({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-marca-oscuro mb-0.5">{label}</p>
      <p className="text-gray-600">{Number(payload[0].value).toLocaleString('es-CO')} tornaguías</p>
    </div>
  )
}

function TooltipDinero({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-marca-oscuro mb-0.5">{label}</p>
      <p className="text-gray-600">{formatearMonedaCOP(Number(payload[0].value))}</p>
    </div>
  )
}

function EstadoVacio() {
  return (
    <div className="h-[220px] flex items-center justify-center text-xs text-gray-400">
      Sin solicitudes registradas en este período.
    </div>
  )
}

/**
 * Dos paneles de un solo eje en vez de una línea con impuesto en eje secundario: un eje dual
 * inventa una correlación arbitraria entre dos magnitudes de escala distinta (conteo vs. dinero).
 * Cada panel es una serie única, así que no necesita leyenda propia — el título ya dice qué mide.
 */
export function GraficaSerieMensual({ datos }: GraficaSerieMensualProps) {
  const hayDatos = datos.some((d) => d.tornaguias > 0 || d.impuesto > 0)
  const puntos = datos.map((d) => ({ ...d, mesLabel: NOMBRES_MES[d.mes - 1] }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <p className="text-sm font-semibold text-marca-oscuro mb-4">Tornaguías por mes</p>
        {hayDatos ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={puntos} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="mesLabel" tick={{ fontSize: 11, fill: '#898781' }} axisLine={{ stroke: '#c3c2b7' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#898781' }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
              <Tooltip content={TooltipCantidad} cursor={{ stroke: '#c3c2b7' }} />
              <Line
                type="monotone"
                dataKey="tornaguias"
                stroke={COLOR_TORNAGUIAS}
                strokeWidth={2}
                dot={{ r: 3, fill: COLOR_TORNAGUIAS, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EstadoVacio />
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <p className="text-sm font-semibold text-marca-oscuro mb-4">Impuesto al consumo por mes</p>
        {hayDatos ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={puntos} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="mesLabel" tick={{ fontSize: 11, fill: '#898781' }} axisLine={{ stroke: '#c3c2b7' }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#898781' }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v: number) => `${Math.round(v / 1000).toLocaleString('es-CO')}k`}
              />
              <Tooltip content={TooltipDinero} cursor={{ stroke: '#c3c2b7' }} />
              <Line
                type="monotone"
                dataKey="impuesto"
                stroke={COLOR_IMPUESTO}
                strokeWidth={2}
                dot={{ r: 3, fill: COLOR_IMPUESTO, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EstadoVacio />
        )}
      </div>
    </div>
  )
}
