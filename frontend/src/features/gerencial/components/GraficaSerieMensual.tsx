import type { ReactNode } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { formatearMonedaCOP } from '../../../shared/lib/formato'
import type { PuntoSerieMensual } from '../types'

const NOMBRES_MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const COLOR_TORNAGUIAS = '#1E88C7' // marca-medio
const COLOR_IMPUESTO = '#2FA84F' // marca-verde

// Sin separador de miles en el número ya escalado: "100.000k" se lee como "100 mil, veces k" (¿100
// millones? ¿100 mil?) en vez de la potencia de mil que realmente es. "100M" no deja ambigüedad.
function formatearEjeImpuesto(valor: number): string {
  if (valor >= 1_000_000) return `${Math.round(valor / 1_000_000)}M`
  if (valor >= 1_000) return `${Math.round(valor / 1_000)}k`
  return String(Math.round(valor))
}

interface GraficaSerieMensualProps {
  datos: PuntoSerieMensual[]
  anio: number | null
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

/**
 * Tarjeta de una serie. La caja del gráfico tiene alto fijo cuando la columna se apila (móvil y
 * tablet) y pasa a repartirse la altura de la fila en `xl`, donde el tablero es de altura fija y
 * estas dos tarjetas deben cuadrar exactamente con el mapa de al lado.
 */
function PanelSerie({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-xl p-4 shadow-sm xl:flex-1 xl:min-h-0">
      <p className="text-sm font-semibold text-marca-oscuro mb-2">{titulo}</p>
      <div className="h-[160px] xl:h-auto xl:flex-1 xl:min-h-0">{children}</div>
    </div>
  )
}

function EstadoVacio() {
  return <div className="h-full flex items-center justify-center text-xs text-gray-400">Sin solicitudes registradas en este período.</div>
}

/**
 * Dos paneles de un solo eje en vez de una línea con impuesto en eje secundario: un eje dual
 * inventa una correlación arbitraria entre dos magnitudes de escala distinta (conteo vs. dinero).
 * Cada panel es una serie única, así que no necesita leyenda propia — el título ya dice qué mide.
 * Se apilan en vertical (antes iban lado a lado) para ocupar la columna derecha de la fila
 * principal junto al mapa, en vez de sumar una fila más de scroll.
 */
export function GraficaSerieMensual({ datos, anio }: GraficaSerieMensualProps) {
  const hayDatos = datos.some((d) => d.tornaguias > 0 || d.impuesto > 0)
  // En un año concreto el mes ya es inequívoco ("Ene"); en histórico completo hay hasta varios años
  // de puntos y el mes solo no alcanza para distinguirlos, así que se agrega el año ("Ene 23").
  const puntos = datos.map((d) => ({
    ...d,
    mesLabel: anio != null ? NOMBRES_MES[d.mes - 1] : `${NOMBRES_MES[d.mes - 1]} ${String(d.anio).slice(-2)}`,
  }))
  // Con un año son 12 ticks, legibles todos. En histórico completo pueden ser 40+ y se amontonan,
  // así que se muestra ~1 de cada N para que el eje siga siendo legible.
  const intervaloEje = anio != null ? 0 : Math.max(0, Math.ceil(puntos.length / 10) - 1)
  const tituloPeriodo = anio != null ? String(anio) : 'histórico completo'

  return (
    <div className="flex flex-col gap-4 xl:h-full">
      <PanelSerie titulo={`Tornaguías por mes · ${tituloPeriodo}`}>
        {hayDatos ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={puntos} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="mesLabel"
                interval={intervaloEje}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
              <Tooltip content={TooltipCantidad} cursor={{ stroke: '#cbd5e1' }} />
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
      </PanelSerie>

      <PanelSerie titulo={`Impuesto al consumo por mes · ${tituloPeriodo}`}>
        {hayDatos ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={puntos} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="mesLabel"
                interval={intervaloEje}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={40}
                tickFormatter={formatearEjeImpuesto}
              />
              <Tooltip content={TooltipDinero} cursor={{ stroke: '#cbd5e1' }} />
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
      </PanelSerie>
    </div>
  )
}
