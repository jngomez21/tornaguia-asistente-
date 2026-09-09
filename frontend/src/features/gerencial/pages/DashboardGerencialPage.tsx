import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from '../../../shared/components/Sidebar'
import { gerencialSidebarItems } from '../../../shared/components/sidebarItemsGerencial'
import { getDashboardGerencial } from '../api/gerencialApi'
import { FiltroAnio } from '../components/FiltroAnio'
import { TarjetasKpi } from '../components/TarjetasKpi'
import { GraficaSerieMensual } from '../components/GraficaSerieMensual'
import { GraficaDistribucionTipo } from '../components/GraficaDistribucionTipo'
import { MapaDepartamentosVolumen } from '../components/MapaDepartamentosVolumen'
import { TopProductos } from '../components/TopProductos'
import { TopRutas } from '../components/TopRutas'
import { TablaContribuyentes } from '../components/TablaContribuyentes'

export function DashboardGerencialPage() {
  const [anio, setAnio] = useState<number | null>(null)
  const nombre = localStorage.getItem('nombre')

  const dashboardQuery = useQuery({
    queryKey: ['gerencial-dashboard', anio],
    queryFn: () => getDashboardGerencial(anio),
    // Conserva el tablero anterior mientras carga el nuevo año, en vez de un parpadeo a skeleton.
    placeholderData: (anterior) => anterior,
  })

  return (
    <div className="min-h-dvh flex bg-gray-50">
      <Sidebar items={gerencialSidebarItems} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-marca-oscuro">{nombre ? `Hola, ${nombre}` : 'Módulo gerencial'}</h1>
              <p className="text-sm text-gray-500">Vista consolidada de todos los contribuyentes.</p>
            </div>
            {dashboardQuery.data && (
              <FiltroAnio anios={dashboardQuery.data.resumen.aniosDisponibles} valor={anio} onChange={setAnio} />
            )}
          </div>

          {dashboardQuery.isLoading && <p className="text-sm text-gray-400">Cargando tablero...</p>}
          {dashboardQuery.isError && <p className="text-sm text-red-600">No fue posible cargar el tablero gerencial.</p>}

          {dashboardQuery.data && (
            <div className={dashboardQuery.isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              <div className="mb-6">
                <TarjetasKpi resumen={dashboardQuery.data.resumen} />
              </div>

              <div className="mb-6">
                <GraficaSerieMensual datos={dashboardQuery.data.serieMensual} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <p className="text-sm font-semibold text-marca-oscuro mb-4">Distribución por tipo</p>
                  <GraficaDistribucionTipo datos={dashboardQuery.data.distribucionPorTipo} />
                </div>
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <p className="text-sm font-semibold text-marca-oscuro mb-4">Volumen por departamento</p>
                  <MapaDepartamentosVolumen datos={dashboardQuery.data.volumenPorDepartamento} />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <p className="text-sm font-semibold text-marca-oscuro mb-4">Top productos por impuesto</p>
                  <TopProductos datos={dashboardQuery.data.topProductos} />
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <p className="text-sm font-semibold text-marca-oscuro mb-4">Top rutas</p>
                  <TopRutas datos={dashboardQuery.data.topRutas} />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="font-semibold text-marca-oscuro">Contribuyentes</p>
                </div>
                <TablaContribuyentes contribuyentes={dashboardQuery.data.contribuyentes} anio={anio} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
