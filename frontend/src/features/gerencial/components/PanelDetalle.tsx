import { useState } from 'react'
import { TablaContribuyentes } from './TablaContribuyentes'
import { TopProductos } from './TopProductos'
import { TopRutas } from './TopRutas'
import type { ContribuyenteResumen, TopProducto, TopRuta } from '../types'

type Pestana = 'contribuyentes' | 'productos' | 'rutas'

interface PanelDetalleProps {
  contribuyentes: ContribuyenteResumen[]
  topProductos: TopProducto[]
  topRutas: TopRuta[]
  anio: number | null
}

/**
 * Contribuyentes, productos y rutas comparten un solo panel de alto fijo con scroll interno. Antes
 * eran tres bloques apilados y la tabla crecía sin techo con el número de contribuyentes, así que
 * el tablero no tenía una altura predecible: el detalle empujaba todo lo demás fuera de pantalla.
 */
export function PanelDetalle({ contribuyentes, topProductos, topRutas, anio }: PanelDetalleProps) {
  const [pestana, setPestana] = useState<Pestana>('contribuyentes')

  const pestanas: { key: Pestana; label: string; cantidad: number }[] = [
    { key: 'contribuyentes', label: 'Contribuyentes', cantidad: contribuyentes.length },
    { key: 'productos', label: 'Top productos', cantidad: topProductos.length },
    { key: 'rutas', label: 'Top rutas', cantidad: topRutas.length },
  ]

  return (
    <section className="flex h-[340px] 2xl:h-[400px] flex-col bg-white border border-gray-200 rounded-xl shadow-sm">
      <div role="tablist" className="flex gap-1 border-b border-gray-100 px-3 pt-2 shrink-0">
        {pestanas.map((p) => (
          <button
            key={p.key}
            type="button"
            role="tab"
            aria-selected={pestana === p.key}
            onClick={() => setPestana(p.key)}
            className={`-mb-px rounded-t-lg border-b-2 px-4 py-2 text-sm font-semibold transition ${
              pestana === p.key
                ? 'border-marca-medio text-marca-medio'
                : 'border-transparent text-gray-500 hover:text-marca-oscuro'
            }`}
          >
            {p.label}
            <span className="ml-1.5 text-xs font-normal text-gray-400 tabular-nums">{p.cantidad}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {pestana === 'contribuyentes' && <TablaContribuyentes contribuyentes={contribuyentes} anio={anio} />}
        {pestana === 'productos' && (
          <div className="p-4">
            <TopProductos datos={topProductos} />
          </div>
        )}
        {pestana === 'rutas' && (
          <div className="p-4">
            <TopRutas datos={topRutas} />
          </div>
        )}
      </div>
    </section>
  )
}
