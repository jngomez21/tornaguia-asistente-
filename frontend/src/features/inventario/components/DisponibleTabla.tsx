import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getInventario, editarInventario } from '../api/inventarioApi'
import { extraerMensajeAxios } from '../../../shared/lib/errores'
import type { InventarioItem } from '../types'

interface DisponibleTablaProps {
  bodegaId: number
}

export function DisponibleTabla({ bodegaId }: DisponibleTablaProps) {
  const queryClient = useQueryClient()
  const inventarioQuery = useQuery({ queryKey: ['inventario', bodegaId], queryFn: () => getInventario(bodegaId) })
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [valorEditado, setValorEditado] = useState('')

  const editarMutation = useMutation({
    mutationFn: ({ productoId, cantidadDisponible }: { productoId: number; cantidadDisponible: number }) =>
      editarInventario(productoId, { bodegaId, cantidadDisponible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario', bodegaId] })
      setEditandoId(null)
    },
  })

  const mensajeError = editarMutation.error
    ? (extraerMensajeAxios(editarMutation.error) ?? 'No se pudo actualizar la cantidad.')
    : null

  function iniciarEdicion(item: InventarioItem) {
    editarMutation.reset()
    setEditandoId(item.productoId)
    setValorEditado(String(item.cantidadDisponible))
  }

  function guardarEdicion(productoId: number) {
    const cantidad = Number(valorEditado)
    if (Number.isNaN(cantidad) || cantidad < 0) return
    editarMutation.mutate({ productoId, cantidadDisponible: cantidad })
  }

  return (
    <div className="mb-6">
      <h2 className="text-sm font-bold text-marca-oscuro mb-3">Disponible</h2>
      {mensajeError && <p className="text-xs text-red-600 mb-2">{mensajeError}</p>}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Producto</th>
              <th className="text-right px-4 py-3">Disponible</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {inventarioQuery.isLoading && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  Cargando...
                </td>
              </tr>
            )}
            {inventarioQuery.data?.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  Aún no tienes mercancía registrada.
                </td>
              </tr>
            )}
            {inventarioQuery.data?.map((item) => (
              <tr key={item.productoId} className="border-t border-gray-100">
                <td className="px-4 py-3">{item.productoNombre}</td>
                <td className="px-4 py-3 text-right">
                  {editandoId === item.productoId ? (
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={valorEditado}
                      onChange={(e) => setValorEditado(e.target.value)}
                      autoFocus
                      className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-marca-medio"
                    />
                  ) : (
                    <span className="font-semibold">{item.cantidadDisponible}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editandoId === item.productoId ? (
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => guardarEdicion(item.productoId)}
                        disabled={editarMutation.isPending}
                        className="text-xs font-semibold text-marca-medio hover:underline disabled:opacity-50"
                      >
                        {editarMutation.isPending ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditandoId(null)}
                        className="text-xs font-semibold text-gray-400 hover:underline"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => iniciarEdicion(item)}
                      className="text-xs font-semibold text-marca-medio hover:underline"
                    >
                      Editar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
