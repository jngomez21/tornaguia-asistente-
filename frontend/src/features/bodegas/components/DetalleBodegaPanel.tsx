import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getInventario, getLotesDisponibles } from '../../inventario/api/inventarioApi'
import { formatearFecha } from '../../../shared/lib/formato'
import type { Bodega } from '../types'

interface DetalleBodegaPanelProps {
  bodega: Bodega
  onCerrar: () => void
}

export function DetalleBodegaPanel({ bodega, onCerrar }: DetalleBodegaPanelProps) {
  const inventarioQuery = useQuery({
    queryKey: ['inventario', bodega.id],
    queryFn: () => getInventario(bodega.id),
  })
  const lotesQuery = useQuery({
    queryKey: ['lotes-disponibles', bodega.id],
    queryFn: () => getLotesDisponibles(bodega.id),
  })

  return (
    <div className="lg:sticky lg:top-10 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0">
          <p className="font-bold text-marca-oscuro leading-tight truncate">{bodega.nombre}</p>
          <p className="text-xs text-gray-400 truncate">
            {bodega.municipioNombre} — {bodega.departamentoNombre}
          </p>
          {bodega.direccionEspecifica && (
            <p className="text-xs text-gray-400 truncate">{bodega.direccionEspecifica}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="shrink-0 text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          ×
        </button>
      </div>

      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mercancía almacenada</p>
      {inventarioQuery.isLoading && <p className="text-sm text-gray-400 mb-4">Cargando...</p>}
      {inventarioQuery.data?.length === 0 && <p className="text-sm text-gray-400 mb-4">Sin mercancía registrada.</p>}
      {inventarioQuery.data && inventarioQuery.data.length > 0 && (
        <div className="space-y-1.5 mb-4">
          {inventarioQuery.data.map((item) => (
            <div key={item.productoId} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-gray-600 truncate">{item.productoNombre}</span>
              <span className="shrink-0 font-semibold text-marca-oscuro bg-gray-50 px-2 py-0.5 rounded-md text-xs">
                {item.cantidadDisponible}
              </span>
            </div>
          ))}
        </div>
      )}

      <hr className="border-gray-100 my-4" />

      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Lotes asociados</p>
      {lotesQuery.isLoading && <p className="text-sm text-gray-400 mb-4">Cargando...</p>}
      {lotesQuery.data?.length === 0 && <p className="text-sm text-gray-400 mb-4">No hay lotes reservados.</p>}
      {lotesQuery.data && lotesQuery.data.length > 0 && (
        <div className="space-y-3 mb-4">
          {lotesQuery.data.map((lote) => (
            <div key={lote.loteId} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-marca-oscuro">{lote.numeroSerie}</span>
                <span className="text-xs text-gray-400">{formatearFecha(lote.fechaCreacion)}</span>
              </div>
              {lote.productos.map((p) => (
                <div key={p.productoId} className="flex items-center justify-between gap-2 text-xs text-gray-500">
                  <span className="truncate">{p.productoNombre}</span>
                  <span className="shrink-0">{p.cantidad}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <Link
        to={`/inventario/lotes?bodegaId=${bodega.id}`}
        className="block text-center bg-marca-oscuro text-white text-sm font-semibold py-2.5 rounded-lg hover:opacity-90 transition"
      >
        Gestionar inventario →
      </Link>
    </div>
  )
}
