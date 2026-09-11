import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { formatearMonedaCOP } from '../../../shared/lib/formato'
import { LIMITE_TOP, normalizarTexto, useListaFiltrada, type DireccionOrden } from '../lib/useListaFiltrada'
import type { TopProducto } from '../types'

const COLOR_BARRA = '#1E88C7' // marca-medio

interface TopProductosProps {
  datos: TopProducto[]
}

type CampoOrden = 'productoNombre' | 'impuesto' | 'unidades'

const CAMPOS: { campo: CampoOrden; label: string }[] = [
  { campo: 'impuesto', label: 'Impuesto' },
  { campo: 'unidades', label: 'Unidades' },
  { campo: 'productoNombre', label: 'Producto' },
]

function valorOrdenable(p: TopProducto, campo: CampoOrden): string | number {
  return campo === 'productoNombre' ? normalizarTexto(p.productoNombre) : p[campo]
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
  const [campoOrden, setCampoOrden] = useState<CampoOrden>('impuesto')
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

  const { termino, setTermino, verTodos, setVerTodos, buscando, visibles, totalCoincidencias, totalGeneral } =
    useListaFiltrada(ordenados, (p, terminoNormalizado) => normalizarTexto(p.productoNombre).includes(terminoNormalizado))

  if (datos.length === 0) {
    return (
      <div className="h-[160px] flex items-center justify-center text-xs text-gray-400">
        Sin productos movilizados en este período.
      </div>
    )
  }

  const altura = Math.max(visibles.length * 34, 120)

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
          placeholder="Buscar producto..."
          className="w-48 max-w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-marca-medio"
        />
      </div>

      <p className="text-xs text-gray-400 mb-2">
        {buscando
          ? `${totalCoincidencias} resultado${totalCoincidencias === 1 ? '' : 's'} para "${termino}"`
          : `Mostrando ${visibles.length} de ${totalGeneral}`}
      </p>

      {visibles.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">Ningún producto coincide con "{termino}".</p>
      ) : (
        <ResponsiveContainer width="100%" height={altura}>
          <BarChart data={visibles} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 4 }}>
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
