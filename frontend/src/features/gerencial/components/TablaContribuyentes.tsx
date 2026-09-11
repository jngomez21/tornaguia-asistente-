import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatearFecha, formatearMonedaCOP } from '../../../shared/lib/formato'
import { getResumenContribuyente } from '../api/gerencialApi'
import { LIMITE_TOP, normalizarTexto, useListaFiltrada, type DireccionOrden } from '../lib/useListaFiltrada'
import type { ContribuyenteResumen } from '../types'

interface TablaContribuyentesProps {
  contribuyentes: ContribuyenteResumen[]
  anio: number | null
}

type CampoOrden = 'nombre' | 'tornaguias' | 'impuesto' | 'ultimaActividad'

const COLUMNAS: { campo: CampoOrden; label: string; alineacion: 'left' | 'right' }[] = [
  { campo: 'nombre', label: 'Contribuyente', alineacion: 'left' },
  { campo: 'tornaguias', label: 'Tornaguías', alineacion: 'right' },
  { campo: 'impuesto', label: 'Impuesto', alineacion: 'right' },
  { campo: 'ultimaActividad', label: 'Última actividad', alineacion: 'right' },
]

function valorOrdenable(c: ContribuyenteResumen, campo: CampoOrden): string | number {
  switch (campo) {
    case 'nombre':
      return normalizarTexto(c.nombre)
    case 'tornaguias':
      return c.tornaguias
    case 'impuesto':
      return c.impuesto
    case 'ultimaActividad':
      return c.ultimaActividad ? new Date(c.ultimaActividad).getTime() : 0
  }
}

// Fila que se expande "bajo demanda": el detalle por contribuyente (GET /gerencial/contribuyentes/{id})
// solo se pide cuando el ejecutivo hace clic, no de entrada para los 12+ contribuyentes de la tabla.
export function TablaContribuyentes({ contribuyentes, anio }: TablaContribuyentesProps) {
  const [expandidoId, setExpandidoId] = useState<number | null>(null)
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

  const ordenados = [...contribuyentes].sort((a, b) => {
    const [va, vb] = [valorOrdenable(a, campoOrden), valorOrdenable(b, campoOrden)]
    const resultado = va < vb ? -1 : va > vb ? 1 : 0
    return direccion === 'desc' ? -resultado : resultado
  })

  const { termino, setTermino, verTodos, setVerTodos, buscando, visibles, totalCoincidencias, totalGeneral } =
    useListaFiltrada(ordenados, (c, terminoNormalizado) => normalizarTexto(c.nombre).includes(terminoNormalizado))

  if (contribuyentes.length === 0) {
    return <p className="text-sm text-gray-400 px-5 py-6">No hay contribuyentes registrados.</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-white border-b border-gray-100">
        <input
          type="text"
          value={termino}
          onChange={(e) => setTermino(e.target.value)}
          placeholder="Buscar contribuyente..."
          className="w-56 max-w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-marca-medio"
        />
        <p className="text-xs text-gray-400 shrink-0">
          {buscando
            ? `${totalCoincidencias} resultado${totalCoincidencias === 1 ? '' : 's'} para "${termino}"`
            : `Mostrando ${visibles.length} de ${totalGeneral}`}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="text-left text-xs text-gray-500">
              {COLUMNAS.map((c) => (
                <th
                  key={c.campo}
                  onClick={() => alternarOrden(c.campo)}
                  className={`px-5 py-3 font-semibold bg-white border-b border-gray-100 cursor-pointer select-none hover:text-marca-oscuro ${
                    c.alineacion === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {c.label}
                  {campoOrden === c.campo && <span className="ml-1 text-marca-medio">{direccion === 'desc' ? '▼' : '▲'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.map((c) => (
              <FilaContribuyente
                key={c.usuarioId}
                contribuyente={c}
                anio={anio}
                expandido={expandidoId === c.usuarioId}
                onToggle={() => setExpandidoId((actual) => (actual === c.usuarioId ? null : c.usuarioId))}
              />
            ))}
          </tbody>
        </table>
      </div>

      {!buscando && totalGeneral > LIMITE_TOP && (
        <div className="px-5 py-2.5">
          <button
            type="button"
            onClick={() => setVerTodos((v) => !v)}
            className="text-xs font-semibold text-marca-medio hover:underline"
          >
            {verTodos ? 'Ver solo el top 10' : `Ver todos (${totalGeneral})`}
          </button>
        </div>
      )}
      {buscando && totalCoincidencias === 0 && (
        <p className="text-sm text-gray-400 px-5 py-6">Ningún contribuyente coincide con "{termino}".</p>
      )}
    </div>
  )
}

interface FilaContribuyenteProps {
  contribuyente: ContribuyenteResumen
  anio: number | null
  expandido: boolean
  onToggle: () => void
}

function FilaContribuyente({ contribuyente, anio, expandido, onToggle }: FilaContribuyenteProps) {
  const detalleQuery = useQuery({
    queryKey: ['gerencial-contribuyente', contribuyente.usuarioId, anio],
    queryFn: () => getResumenContribuyente(contribuyente.usuarioId, anio),
    enabled: expandido,
  })

  return (
    <>
      <tr onClick={onToggle} className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition">
        <td className="px-5 py-3 font-medium text-marca-oscuro">{contribuyente.nombre}</td>
        <td className="px-5 py-3 text-right text-gray-700">{contribuyente.tornaguias.toLocaleString('es-CO')}</td>
        <td className="px-5 py-3 text-right text-gray-700">{formatearMonedaCOP(contribuyente.impuesto)}</td>
        <td className="px-5 py-3 text-right text-gray-400 text-xs">
          {contribuyente.ultimaActividad ? formatearFecha(contribuyente.ultimaActividad) : 'Sin actividad'}
        </td>
      </tr>
      {expandido && (
        <tr className="bg-gray-50/60">
          <td colSpan={4} className="px-5 py-4">
            {detalleQuery.isLoading && <p className="text-xs text-gray-400">Cargando detalle...</p>}
            {detalleQuery.data && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                <div>
                  <p className="text-gray-400">Bodegas</p>
                  <p className="font-semibold text-marca-oscuro">{detalleQuery.data.totalBodegas}</p>
                </div>
                <div>
                  <p className="text-gray-400">Lotes reservados</p>
                  <p className="font-semibold text-marca-oscuro">{detalleQuery.data.lotesReservados}</p>
                </div>
                <div>
                  <p className="text-gray-400">Impuesto recaudado</p>
                  <p className="font-semibold text-marca-oscuro">{formatearMonedaCOP(detalleQuery.data.impuestoRecaudado)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Impuesto por causar</p>
                  <p className="font-semibold text-marca-oscuro">{formatearMonedaCOP(detalleQuery.data.impuestoPorCausar)}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-gray-400 mb-1">Por tipo</p>
                  <ul className="space-y-0.5">
                    {detalleQuery.data.porTipo.map((t) => (
                      <li key={t.tipo} className="text-marca-oscuro">
                        {t.tipo}: {t.cantidad}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
