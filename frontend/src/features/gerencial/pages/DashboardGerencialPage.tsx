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
import { PanelDetalle } from '../components/PanelDetalle'
import { FiltroDepartamentoActivo } from '../components/FiltroDepartamentoActivo'

/**
 * Tablero de altura acotada: KPIs en una tira, distribución en una banda, mapa y series en una
 * fila única de alto fijo, y el detalle (contribuyentes/productos/rutas) en un panel con scroll
 * propio. La versión anterior apilaba cinco filas dentro de `max-w-6xl` y medía ~2000px, así que
 * comparar un KPI con el mapa obligaba a recordar en vez de mirar.
 *
 * El scroll es el del documento. El `<main>` no lleva `overflow-y-auto`: el contenedor usa
 * `min-h-dvh` (no `h-dvh`), así que nunca acotaba la altura del main y esa regla no hacía nada,
 * mientras el sidebar sí quedaba fijo por su cuenta (`h-dvh sticky`).
 */
export function DashboardGerencialPage() {
  const [anio, setAnio] = useState<number | null>(null)
  const [departamentoId, setDepartamentoId] = useState<number | null>(null)
  const nombre = localStorage.getItem('nombre')

  const dashboardQuery = useQuery({
    queryKey: ['gerencial-dashboard', anio, departamentoId],
    queryFn: () => getDashboardGerencial(anio, departamentoId),
    // Conserva el tablero anterior mientras carga el nuevo filtro, en vez de un parpadeo a skeleton.
    placeholderData: (anterior) => anterior,
  })

  const nombreDepartamentoActivo = dashboardQuery.data?.volumenPorDepartamento.find(
    (d) => d.departamentoId === departamentoId
  )?.nombre

  return (
    <div className="min-h-dvh flex bg-gray-50">
      <Sidebar items={gerencialSidebarItems} />

      <main className="flex-1 min-w-0">
        <div className="max-w-[1600px] mx-auto px-5 pb-8 sm:px-8">
          {/* Sticky: el filtro de año redefine todo el tablero, así que no puede perderse al bajar. */}
          <div className="sticky top-0 z-30 -mx-5 sm:-mx-8 px-5 sm:px-8 py-4 mb-4 flex flex-wrap items-center justify-between gap-4 bg-gray-50/95 backdrop-blur border-b border-gray-200">
            <div>
              <h1 className="text-xl font-bold text-marca-oscuro">
                {nombre ? `Hola, ${nombre}` : 'Módulo gerencial'}
              </h1>
              <p className="text-sm text-gray-500">Vista consolidada de todos los contribuyentes.</p>
            </div>
            <div className="flex items-center gap-3">
              {departamentoId !== null && nombreDepartamentoActivo && (
                <FiltroDepartamentoActivo nombre={nombreDepartamentoActivo} onQuitar={() => setDepartamentoId(null)} />
              )}
              {dashboardQuery.data && (
                <FiltroAnio anios={dashboardQuery.data.resumen.aniosDisponibles} valor={anio} onChange={setAnio} />
              )}
            </div>
          </div>

          {dashboardQuery.isLoading && <p className="text-sm text-gray-400">Cargando tablero...</p>}
          {dashboardQuery.isError && <p className="text-sm text-red-600">No fue posible cargar el tablero gerencial.</p>}

          {dashboardQuery.data && (
            <div className={dashboardQuery.isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              <TarjetasKpi resumen={dashboardQuery.data.resumen} />

              <section className="mt-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
                  <p className="text-sm font-semibold text-marca-oscuro shrink-0 lg:w-44">Distribución por tipo</p>
                  <div className="flex-1 min-w-0">
                    <GraficaDistribucionTipo datos={dashboardQuery.data.distribucionPorTipo} />
                  </div>
                </div>
              </section>

              {/* Fila principal: en `xl` tiene alto fijo y las dos columnas cuadran entre sí; por
                  debajo se apilan y cada bloque usa su propio alto mínimo. */}
              <div className="mt-4 grid grid-cols-1 gap-4 xl:h-[420px] xl:grid-cols-12">
                <section className="xl:col-span-5 flex flex-col bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <p className="text-sm font-semibold text-marca-oscuro mb-2">Volumen por departamento</p>
                  <div className="h-[320px] xl:h-auto xl:flex-1 xl:min-h-0">
                    <MapaDepartamentosVolumen
                      datos={dashboardQuery.data.volumenPorDepartamento}
                      departamentoSeleccionadoId={departamentoId}
                      onSeleccionar={(d) => setDepartamentoId(d.departamentoId)}
                    />
                  </div>
                </section>

                <div className="xl:col-span-7 xl:h-full">
                  <GraficaSerieMensual datos={dashboardQuery.data.serieMensual} anio={anio} />
                </div>
              </div>

              <div className="mt-4">
                <PanelDetalle
                  contribuyentes={dashboardQuery.data.contribuyentes}
                  topProductos={dashboardQuery.data.topProductos}
                  topRutas={dashboardQuery.data.topRutas}
                  anio={anio}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
