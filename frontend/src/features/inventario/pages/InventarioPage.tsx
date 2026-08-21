import { useQuery } from '@tanstack/react-query'
import { Sidebar } from '../../../shared/components/Sidebar'
import { inventarioSidebarItems } from '../sidebarItems'
import { getInventario } from '../api/inventarioApi'
import { EntradaForm } from '../components/EntradaForm'

export function InventarioPage() {
  const inventarioQuery = useQuery({ queryKey: ['inventario'], queryFn: getInventario })

  return (
    <div className="min-h-dvh flex bg-gray-50">
      <Sidebar items={inventarioSidebarItems} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 sm:p-10">
          <h1 className="text-2xl font-bold text-marca-oscuro mb-1">Inventario</h1>
          <p className="text-sm text-gray-500 mb-6">
            Mercancía disponible para armar los lotes que vas a movilizar.
          </p>

          <EntradaForm />

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Producto</th>
                  <th className="text-right px-4 py-3">Disponible</th>
                </tr>
              </thead>
              <tbody>
                {inventarioQuery.isLoading && (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-gray-400">
                      Cargando...
                    </td>
                  </tr>
                )}
                {inventarioQuery.data?.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-gray-400">
                      Aún no tienes mercancía registrada.
                    </td>
                  </tr>
                )}
                {inventarioQuery.data?.map((item) => (
                  <tr key={item.productoId} className="border-t border-gray-100">
                    <td className="px-4 py-3">{item.productoNombre}</td>
                    <td className="px-4 py-3 text-right font-semibold">{item.cantidadDisponible}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
