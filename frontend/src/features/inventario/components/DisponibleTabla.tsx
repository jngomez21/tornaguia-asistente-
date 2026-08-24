import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { getInventario, deshacerUltimaEntrada } from '../api/inventarioApi'

export function DisponibleTabla() {
  const queryClient = useQueryClient()
  const inventarioQuery = useQuery({ queryKey: ['inventario'], queryFn: getInventario })
  const [deshaciendoId, setDeshaciendoId] = useState<number | null>(null)

  const deshacerMutation = useMutation({
    mutationFn: deshacerUltimaEntrada,
    onMutate: (productoId: number) => setDeshaciendoId(productoId),
    onSettled: () => setDeshaciendoId(null),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventario'] }),
  })

  const mensajeError = isAxiosError<{ mensaje?: string }>(deshacerMutation.error)
    ? deshacerMutation.error.response?.data?.mensaje
    : deshacerMutation.error
      ? 'No se pudo deshacer la entrada.'
      : null

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
                <td className="px-4 py-3 text-right font-semibold">{item.cantidadDisponible}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => deshacerMutation.mutate(item.productoId)}
                    disabled={deshaciendoId === item.productoId}
                    className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-50"
                  >
                    {deshaciendoId === item.productoId ? 'Deshaciendo...' : 'Deshacer última'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
