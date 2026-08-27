import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../../../shared/components/Sidebar'
import { appSidebarItems } from '../../../shared/components/sidebarItems'
import { formatearFecha } from '../../../shared/lib/formato'
import { getLotesDisponibles } from '../../inventario/api/inventarioApi'
import { getHistorialSolicitudes } from '../../solicitudes/api/solicitudesApi'
import { colorPorTipo } from '../../solicitudes/lib/coloresTornaguia'
import type { HistorialSolicitud } from '../../solicitudes/types'

interface OpcionInicio {
  titulo: string
  descripcion: string
  ruta: string
  icono: ReactNode
}

const opciones: OpcionInicio[] = [
  {
    titulo: 'Crear lote',
    descripcion: 'Agrupa la mercancía que vas a movilizar antes de solicitar una tornaguía.',
    ruta: '/inventario/lotes',
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <rect x="4" y="4" width="7" height="7" rx="1" />
        <rect x="13" y="4" width="7" height="7" rx="1" />
        <rect x="4" y="13" width="7" height="7" rx="1" />
        <rect x="13" y="13" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    titulo: 'Nueva solicitud',
    descripcion: 'Determina el tipo de tornaguía que necesitas según origen, destino y declaración.',
    ruta: '/solicitudes/nueva',
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
    ),
  },
]

function destino(item: HistorialSolicitud) {
  return item.municipioDestinoNombre ?? item.paisDestinoNombre ?? '—'
}

function formatearHaceTiempo(fechaIso: string): string {
  const minutos = Math.floor((Date.now() - new Date(fechaIso).getTime()) / 60000)
  if (minutos < 1) return 'hace un momento'
  if (minutos < 60) return `hace ${minutos} minuto${minutos === 1 ? '' : 's'}`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} hora${horas === 1 ? '' : 's'}`
  const dias = Math.floor(horas / 24)
  return dias === 1 ? 'hace 1 día' : `hace ${dias} días`
}

interface StatCardProps {
  label: string
  valor: number | undefined
  ruta: string
  delayMs: number
  onSeleccionar: (ruta: string) => void
}

function StatCard({ label, valor, ruta, delayMs, onSeleccionar }: StatCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSeleccionar(ruta)}
      style={{ animationDelay: `${delayMs}ms` }}
      className="animate-fade-slide-up text-left bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition"
    >
      <p className="text-2xl font-bold text-marca-oscuro">{valor ?? '—'}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </button>
  )
}

export function InicioPage() {
  const navigate = useNavigate()
  const nombre = localStorage.getItem('nombre')

  const lotesQuery = useQuery({ queryKey: ['lotes-disponibles'], queryFn: () => getLotesDisponibles() })
  const historialQuery = useQuery({ queryKey: ['historial-solicitudes'], queryFn: getHistorialSolicitudes })

  const solicitudesPendientes = useMemo(
    () => historialQuery.data?.filter((item) => !item.tieneDetalleGenerado).length,
    [historialQuery.data],
  )

  const recientes = useMemo(() => {
    if (!historialQuery.data) return []
    return [...historialQuery.data]
      .sort((a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime())
      .slice(0, 6)
  }, [historialQuery.data])

  const ultimaGenerada = useMemo(() => {
    return historialQuery.data
      ?.filter((item) => item.tieneDetalleGenerado)
      .sort((a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime())[0]
  }, [historialQuery.data])

  const stats = [
    { label: 'Lotes disponibles', valor: lotesQuery.data?.length, ruta: '/inventario/lotes' },
    { label: 'Solicitudes totales', valor: historialQuery.data?.length, ruta: '/solicitudes/historial' },
    { label: 'Pendientes de generar', valor: solicitudesPendientes, ruta: '/solicitudes/historial' },
  ]

  return (
    <div className="min-h-dvh flex bg-gray-50">
      <Sidebar items={appSidebarItems} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 sm:p-10">
          <div className="animate-fade-slide-up mb-8 text-center">
            <h1 className="text-2xl font-bold text-marca-oscuro mb-1">
              {nombre ? `Hola, ${nombre}` : 'Hola'}
            </h1>
            <p className="text-sm text-gray-500">Este es el estado de tu cuenta.</p>
            {ultimaGenerada && (
              <p className="text-xs text-gray-400 mt-1">
                Última tornaguía generada {formatearHaceTiempo(ultimaGenerada.fechaSolicitud)}.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {stats.map((stat, i) => (
              <StatCard key={stat.label} {...stat} delayMs={80 + i * 70} onSeleccionar={navigate} />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
            {opciones.map((opcion, i) => (
              <button
                key={opcion.ruta}
                type="button"
                onClick={() => navigate(opcion.ruta)}
                style={{ animationDelay: `${300 + i * 70}ms` }}
                className="animate-fade-slide-up text-center bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-marca-medio/50 transition"
              >
                <div className="w-12 h-12 mx-auto rounded-lg bg-marca-medio/10 flex items-center justify-center text-marca-medio mb-4">
                  {opcion.icono}
                </div>
                <p className="font-semibold text-marca-oscuro mb-1">{opcion.titulo}</p>
                <p className="text-sm text-gray-500">{opcion.descripcion}</p>
              </button>
            ))}
          </div>

          <div
            style={{ animationDelay: '440ms' }}
            className="animate-fade-slide-up bg-white border border-gray-200 rounded-xl shadow-sm"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="font-semibold text-marca-oscuro">Actividad reciente</p>
              <button
                type="button"
                onClick={() => navigate('/solicitudes/historial')}
                className="text-xs font-semibold text-marca-medio hover:underline"
              >
                Ver historial completo
              </button>
            </div>

            {historialQuery.isLoading && (
              <p className="text-sm text-gray-400 px-5 py-6">Cargando actividad...</p>
            )}

            {historialQuery.data && recientes.length === 0 && (
              <div className="flex flex-col items-center text-center px-5 py-10">
                <div className="w-14 h-14 rounded-full bg-marca-medio/10 flex items-center justify-center text-marca-medio mb-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
                    <path d="M9 3h6l3 3v15H6V6l3-3Z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 12h6M9 16h4" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 mb-3">Aún no has realizado ninguna solicitud.</p>
                <button
                  type="button"
                  onClick={() => navigate('/solicitudes/nueva')}
                  className="text-sm font-semibold text-marca-medio hover:underline"
                >
                  Crear tu primera solicitud
                </button>
              </div>
            )}

            {recientes.map((item) => (
              <div
                key={item.solicitudId}
                className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`inline-block shrink-0 ${colorPorTipo[item.tipoTornaguia] ?? 'bg-marca-oscuro'} text-white text-xs font-semibold px-3 py-1 rounded-full`}
                  >
                    {item.tipoTornaguia}
                  </span>
                  <p className="text-sm text-gray-700 truncate">
                    {item.municipioOrigenNombre} → {destino(item)}
                  </p>
                </div>
                <p className="text-xs text-gray-400 shrink-0">{formatearFecha(item.fechaSolicitud)}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
