import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getHistorialSolicitudes,
  getMunicipios,
  getPdfTornaguia,
  getSolicitud,
  guardarDetalleTornaguia,
  guardarPdfTornaguia,
} from '../api/solicitudesApi'
import { construirPdfTornaguia, descargarPdf, bytesABase64 } from '../lib/generarPdfTornaguia'
import type { DatosRutaTornaguia } from '../lib/generarPdfTornaguia'
import { mapearDetalleARequest } from '../lib/mapearDetalle'
import { colorPorTipo } from '../lib/coloresTornaguia'
import { ModalDetalleTornaguia } from '../components/ModalDetalleTornaguia'
import { Sidebar } from '../../../shared/components/Sidebar'
import { appSidebarItems } from '../../../shared/components/sidebarItems'
import { formatearFecha } from '../../../shared/lib/formato'
import { extraerMensajeAxios } from '../../../shared/lib/errores'
import type { DetalleTornaguiaFormValues } from '../schemas'
import type { CrearSolicitudResponse, HistorialSolicitud } from '../types'

const TIPOS_TORNAGUIA = ['Movilización', 'Reenvío', 'Tránsito']

function destino(item: HistorialSolicitud) {
  return item.municipioDestinoNombre ?? item.paisDestinoNombre ?? '—'
}

interface SolicitudEnRetomada {
  solicitudId: number
  etiqueta: string
  resultado: CrearSolicitudResponse
  ruta: DatosRutaTornaguia
}

export function HistorialPage() {
  const queryClient = useQueryClient()
  const historialQuery = useQuery({ queryKey: ['historial-solicitudes'], queryFn: getHistorialSolicitudes })
  const municipiosQuery = useQuery({ queryKey: ['municipios'], queryFn: getMunicipios })

  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<'' | 'generada' | 'pendiente'>('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [descargandoId, setDescargandoId] = useState<number | null>(null)
  const [cargandoRetomarId, setCargandoRetomarId] = useState<number | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [solicitudARetomar, setSolicitudARetomar] = useState<SolicitudEnRetomada | null>(null)

  const historialFiltrado = useMemo(() => {
    if (!historialQuery.data) return []
    const texto = busqueda.trim().toLowerCase()
    const desde = fechaDesde ? new Date(`${fechaDesde}T00:00:00`) : null
    const hasta = fechaHasta ? new Date(`${fechaHasta}T23:59:59`) : null

    return historialQuery.data.filter((item) => {
      if (tipoFiltro && item.tipoTornaguia !== tipoFiltro) return false
      if (estadoFiltro === 'generada' && !item.tieneDetalleGenerado) return false
      if (estadoFiltro === 'pendiente' && item.tieneDetalleGenerado) return false

      const fecha = new Date(item.fechaSolicitud)
      if (desde && fecha < desde) return false
      if (hasta && fecha > hasta) return false

      if (texto) {
        const contenido = `${item.municipioOrigenNombre} ${destino(item)} ${item.tipoTornaguia}`.toLowerCase()
        if (!contenido.includes(texto)) return false
      }

      return true
    })
  }, [historialQuery.data, busqueda, tipoFiltro, estadoFiltro, fechaDesde, fechaHasta])

  const hayFiltrosActivos =
    busqueda.trim() !== '' || tipoFiltro !== '' || estadoFiltro !== '' || fechaDesde !== '' || fechaHasta !== ''

  function limpiarFiltros() {
    setBusqueda('')
    setTipoFiltro('')
    setEstadoFiltro('')
    setFechaDesde('')
    setFechaHasta('')
  }

  async function descargarPdfDeHistorial(item: HistorialSolicitud) {
    setErrorAccion(null)
    setDescargandoId(item.solicitudId)
    try {
      const bytes = await getPdfTornaguia(item.solicitudId)
      descargarPdf(bytes, `tornaguia-${item.solicitudId}.pdf`)
    } catch {
      setErrorAccion('No se pudo descargar el PDF de esta tornaguía.')
    } finally {
      setDescargandoId(null)
    }
  }

  function departamentoDeMunicipio(nombre: string | null) {
    if (!nombre) return null
    return municipiosQuery.data?.find((m) => m.nombre === nombre)?.departamentoNombre ?? '—'
  }

  async function retomarSolicitud(item: HistorialSolicitud) {
    setErrorAccion(null)
    setCargandoRetomarId(item.solicitudId)
    try {
      const resultado = await getSolicitud(item.solicitudId)
      setSolicitudARetomar({
        solicitudId: item.solicitudId,
        etiqueta: `${item.municipioOrigenNombre} → ${destino(item)}`,
        resultado,
        ruta: {
          origenDepartamento: departamentoDeMunicipio(item.municipioOrigenNombre) ?? '—',
          origenMunicipio: item.municipioOrigenNombre,
          destinoDepartamento: departamentoDeMunicipio(item.municipioDestinoNombre),
          destinoMunicipio: destino(item),
          departamentosIntermedios: resultado.departamentosIntermedios ?? [],
        },
      })
    } catch {
      setErrorAccion('No se pudo cargar la solicitud pendiente.')
    } finally {
      setCargandoRetomarId(null)
    }
  }

  const retomarMutation = useMutation({
    mutationFn: async (values: DetalleTornaguiaFormValues) => {
      if (!solicitudARetomar) throw new Error('No hay solicitud en proceso.')
      const detalle = await guardarDetalleTornaguia(solicitudARetomar.solicitudId, mapearDetalleARequest(values))
      const bytes = await construirPdfTornaguia(solicitudARetomar.resultado, detalle, solicitudARetomar.ruta)
      await guardarPdfTornaguia(solicitudARetomar.solicitudId, bytesABase64(bytes))
      return bytes
    },
    onSuccess: (bytes) => {
      if (solicitudARetomar) descargarPdf(bytes, `tornaguia-${solicitudARetomar.solicitudId}.pdf`)
      setSolicitudARetomar(null)
      queryClient.invalidateQueries({ queryKey: ['historial-solicitudes'] })
    },
    onError: (error) => {
      setErrorAccion(extraerMensajeAxios(error) ?? 'No se pudo generar la tornaguía.')
    },
  })

  return (
    <div className="min-h-dvh flex bg-gray-50">
      <Sidebar items={appSidebarItems} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 sm:p-10">
          <h1 className="text-2xl font-bold text-marca-oscuro mb-1 text-center">Historial de solicitudes</h1>
          <p className="text-sm text-gray-500 mb-6 text-center">Consultas de tornaguía que has realizado.</p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por municipio, país o tipo..."
              className="flex-1 min-w-[220px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marca-medio/40"
            />

            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marca-medio/40"
            >
              <option value="">Todos los tipos</option>
              {TIPOS_TORNAGUIA.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>

            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value as '' | 'generada' | 'pendiente')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marca-medio/40"
            >
              <option value="">Cualquier estado</option>
              <option value="generada">Tornaguía generada</option>
              <option value="pendiente">Pendiente de generar</option>
            </select>

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                max={fechaHasta || undefined}
                className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marca-medio/40"
              />
              <label className="text-xs text-gray-500">Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                min={fechaDesde || undefined}
                className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marca-medio/40"
              />
            </div>

            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="shrink-0 text-sm font-semibold text-marca-medio hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {historialQuery.isLoading && <p className="text-sm text-gray-500">Cargando historial...</p>}

          {historialQuery.isError && (
            <p className="text-sm text-red-600">No se pudo cargar el historial. Intenta de nuevo más tarde.</p>
          )}

          {errorAccion && <p className="text-sm text-red-600 mb-4">{errorAccion}</p>}

          {historialQuery.data && historialQuery.data.length === 0 && (
            <div className="border border-dashed border-gray-300 rounded-xl p-10 text-center">
              <p className="text-sm text-gray-500">Aún no has realizado ninguna solicitud.</p>
            </div>
          )}

          {historialQuery.data && historialQuery.data.length > 0 && historialFiltrado.length === 0 && (
            <div className="border border-dashed border-gray-300 rounded-xl p-10 text-center">
              <p className="text-sm text-gray-500">Ninguna solicitud coincide con los filtros aplicados.</p>
            </div>
          )}

          {historialFiltrado.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-center text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Origen → Destino</th>
                    <th className="px-4 py-3 font-semibold">Declarado</th>
                    <th className="px-5 py-3 font-semibold">Lote</th>
                    <th className="px-5 py-3 font-semibold">Tornaguía</th>
                  </tr>
                </thead>
                <tbody>
                  {historialFiltrado.map((item) => (
                    <tr key={item.solicitudId} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3 text-center text-gray-600 whitespace-nowrap">{formatearFecha(item.fechaSolicitud)}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block ${colorPorTipo[item.tipoTornaguia] ?? 'bg-marca-oscuro'} text-white text-xs font-semibold px-3 py-1 rounded-full`}
                        >
                          {item.tipoTornaguia}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">
                        {item.municipioOrigenNombre} → {destino(item)}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{item.estaDeclarado ? 'Sí' : 'No'}</td>
                      <td className="px-5 py-3 text-center text-gray-600 whitespace-nowrap">{item.loteNumeroSerie ?? '—'}</td>
                      <td className="px-5 py-3 text-center whitespace-nowrap">
                        {item.tienePdf ? (
                          <button
                            type="button"
                            onClick={() => descargarPdfDeHistorial(item)}
                            disabled={descargandoId === item.solicitudId}
                            className="flex items-center justify-center gap-1.5 text-marca-oscuro font-semibold hover:underline disabled:opacity-50"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                              <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {descargandoId === item.solicitudId ? 'Descargando...' : 'Descargar PDF'}
                          </button>
                        ) : item.tieneDetalleGenerado ? (
                          <span className="text-gray-400">PDF no disponible</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => retomarSolicitud(item)}
                            disabled={cargandoRetomarId === item.solicitudId}
                            className="flex items-center justify-center gap-1.5 text-marca-medio font-semibold hover:underline disabled:opacity-50"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                              <path d="M4 4v5h5M4 9a8 8 0 1 1 2.34 5.66" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {cargandoRetomarId === item.solicitudId ? 'Cargando...' : 'Retomar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {solicitudARetomar && (
        <ModalDetalleTornaguia
          titulo={solicitudARetomar.etiqueta}
          textoBotonPrincipal="Generar tornaguía"
          enviando={retomarMutation.isPending}
          onCerrar={() => setSolicitudARetomar(null)}
          onConfirmar={(values) => retomarMutation.mutate(values)}
        />
      )}
    </div>
  )
}
