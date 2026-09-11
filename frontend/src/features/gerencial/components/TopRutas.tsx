import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { LIMITE_TOP, normalizarTexto, useListaFiltrada, type DireccionOrden } from '../lib/useListaFiltrada'
import type { TopRuta } from '../types'

const COLOR_BARRA = '#1E88C7' // marca-medio

interface TopRutasProps {
  datos: TopRuta[]
}

type CampoOrden = 'ruta' | 'cantidad'

const CAMPOS: { campo: CampoOrden; label: string }[] = [
  { campo: 'cantidad', label: 'Cantidad' },
  { campo: 'ruta', label: 'Ruta' },
]

function etiquetaRuta(ruta: TopRuta): string {
  return `${ruta.origen} → ${ruta.destino}`
}

function valorOrdenable(r: TopRuta, campo: CampoOrden): string | number {
  return campo === 'cantidad' ? r.cantidad : normalizarTexto(etiquetaRuta(r))
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
  const [campoOrden, setCampoOrden] = useState<CampoOrden>('cantidad')
  const [direccion, setDireccion] = useState<DireccionOrden>('desc')

  function alternarOrden(campo: CampoOrden) {
    if (campo === campoOrden) {
      setDireccion((actual) => (actual === 'desc' ? 'asc' : 'desc'))
    } else {
      setCampoOrden(campo)
      setDireccion('desc')
    }
  }

  const ordenados = [...datos].sort((a, b) => {
    const [va, vb] = [valorOrdenable(a, campoOrden), valorOrdenable(b, campoOrden)]
    const resultado = va < vb ? -1 : va > vb ? 1 : 0
    return direccion === 'desc' ? -resultado : resultado
  })

  // Busca por origen o destino (coincide con cualquiera de los dos), no solo con la etiqueta combinada,
  // así "Bogotá" encuentra tanto rutas que salen de Bogotá como las que llegan a Bogotá.
  const { termino, setTermino, verTodos, setVerTodos, buscando, visibles, totalCoincidencias, totalGeneral } =
    useListaFiltrada(
      ordenados,
      (r, terminoNormalizado) =>
        normalizarTexto(r.origen).includes(terminoNormalizado) || normalizarTexto(r.destino).includes(terminoNormalizado)
    )

  if (datos.length === 0) {
    return (
      <div className="h-[160px] flex items-center justify-center text-xs text-gray-400">
        Sin rutas registradas en este período.
      </div>
    )
  }

  const puntos = visibles.map((d) => ({ ...d, ruta: etiquetaRuta(d) }))
  const altura = Math.max(puntos.length * 34, 120)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-400 mr-1">Ordenar por:</span>
          {CAMPOS.map((c) => (
            <button
              key={c.campo}
              type="button"
              onClick={() => alternarOrden(c.campo)}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                campoOrden === c.campo
                  ? 'border-marca-medio bg-marca-medio/10 text-marca-medio'
                  : 'border-gray-200 text-gray-500 hover:text-marca-oscuro'
              }`}
            >
              {c.label}
              {campoOrden === c.campo && <span className="ml-1">{direccion === 'desc' ? '▼' : '▲'}</span>}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={termino}
          onChange={(e) => setTermino(e.target.value)}
          placeholder="Buscar origen o destino..."
          className="w-52 max-w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-marca-medio"
        />
      </div>

      <p className="text-xs text-gray-400 mb-2">
        {buscando
          ? `${totalCoincidencias} resultado${totalCoincidencias === 1 ? '' : 's'} para "${termino}"`
          : `Mostrando ${puntos.length} de ${totalGeneral}`}
      </p>

      {puntos.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">Ninguna ruta coincide con "{termino}".</p>
      ) : (
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
      )}

      {!buscando && totalGeneral > LIMITE_TOP && (
        <button
          type="button"
          onClick={() => setVerTodos((v) => !v)}
          className="mt-2 text-xs font-semibold text-marca-medio hover:underline"
        >
          {verTodos ? 'Ver solo el top 10' : `Ver todos (${totalGeneral})`}
        </button>
      )}
    </div>
  )
}
