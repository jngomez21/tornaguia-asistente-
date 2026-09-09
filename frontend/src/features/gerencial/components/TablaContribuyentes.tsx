import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatearFecha, formatearMonedaCOP } from '../../../shared/lib/formato'
import { getResumenContribuyente } from '../api/gerencialApi'
import type { ContribuyenteResumen } from '../types'

interface TablaContribuyentesProps {
  contribuyentes: ContribuyenteResumen[]
  anio: number | null
}

// Fila que se expande "bajo demanda": el detalle por contribuyente (GET /gerencial/contribuyentes/{id})
// solo se pide cuando el ejecutivo hace clic, no de entrada para los 12+ contribuyentes de la tabla.
export function TablaContribuyentes({ contribuyentes, anio }: TablaContribuyentesProps) {
  const [expandidoId, setExpandidoId] = useState<number | null>(null)

  if (contribuyentes.length === 0) {
    return <p className="text-sm text-gray-400 px-5 py-6">No hay contribuyentes registrados.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
            <th className="px-5 py-3 font-semibold">Contribuyente</th>
            <th className="px-5 py-3 font-semibold text-right">Tornaguías</th>
            <th className="px-5 py-3 font-semibold text-right">Impuesto</th>
            <th className="px-5 py-3 font-semibold text-right">Última actividad</th>
          </tr>
        </thead>
        <tbody>
          {contribuyentes.map((c) => (
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
                  <p className="text-gray-400">Impuesto causado</p>
                  <p className="font-semibold text-marca-oscuro">{formatearMonedaCOP(detalleQuery.data.impuestoCausado)}</p>
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
