import type { CrearSolicitudResponse } from '../types'
import { MapaRutasTornaguias } from './MapaRutasTornaguias'
import { colorPorTipo } from '../lib/coloresTornaguia'

export type EstadoTornaguiaPdf = 'pendiente' | 'en_carrito' | 'generado'

interface ResultadoSolicitudProps {
  resultado: CrearSolicitudResponse
  onNuevaSolicitud?: () => void
  titulo?: string
  onSolicitarTornaguia?: () => void
  onDescargarPdf?: () => void
  onVistaPreviaPdf?: () => void
  estadoPdf?: EstadoTornaguiaPdf
  mostrarMapa?: boolean
  onClickBadge?: () => void
  tipoDestino?: 'municipio' | 'pais'
  esParaExportacion?: boolean
}

const textoPorEstado: Record<EstadoTornaguiaPdf, { titulo: string; subtitulo: string }> = {
  pendiente: {
    titulo: 'Solicitud de Tornaguía',
    subtitulo: 'Genera el PDF con los datos de esta tornaguía',
  },
  en_carrito: {
    titulo: 'Datos completos ✓',
    subtitulo: 'Editar antes de generar el lote',
  },
  generado: {
    titulo: 'Tornaguía generada ✓',
    subtitulo: 'Descarga el PDF cuando quieras',
  },
}

export function ResultadoSolicitud({
  resultado,
  onNuevaSolicitud,
  titulo,
  onSolicitarTornaguia,
  onDescargarPdf,
  onVistaPreviaPdf,
  estadoPdf = 'pendiente',
  mostrarMapa = true,
  onClickBadge,
  tipoDestino,
  esParaExportacion,
}: ResultadoSolicitudProps) {
  const colorBadge = colorPorTipo[resultado.tipoTornaguia] ?? 'bg-marca-oscuro'
  const tieneIntermedios = (resultado.departamentosIntermedios?.length ?? 0) > 0
  const textoBoton = textoPorEstado[estadoPdf]
  const claseBadge = `inline-block self-start ${colorBadge} text-white text-xs font-semibold px-3 py-1 rounded-full mb-4`

  return (
    <div className="w-full h-full flex flex-col">
      {titulo && (
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3 pb-3 border-b border-gray-100">
          {titulo}
        </p>
      )}
      {onClickBadge ? (
        <button type="button" onClick={onClickBadge} className={`${claseBadge} hover:opacity-90 transition`}>
          Solicitud #{resultado.solicitudId}
        </button>
      ) : (
        <span className={claseBadge}>Solicitud #{resultado.solicitudId}</span>
      )}

      <h1 className="text-2xl font-bold text-marca-oscuro mb-1">Tornaguía de {resultado.tipoTornaguia}</h1>
      <p className="text-sm text-gray-600 mb-6">{resultado.justificacion}</p>

      {mostrarMapa && resultado.geometria && resultado.geometria.length > 1 && (
        <MapaRutasTornaguias
          animar
          rutas={[
            {
              solicitudId: resultado.solicitudId,
              geometria: resultado.geometria,
              tipoTornaguia: resultado.tipoTornaguia,
              justificacion: resultado.justificacion,
              estadoPdf,
              tipoDestino,
              esParaExportacion,
              departamentosIntermedioIds: resultado.departamentosIntermedioIds ?? undefined,
              esAproximada: resultado.esAproximada,
              onSolicitarTornaguia,
              onDescargarPdf,
              onVistaPreviaPdf,
            },
          ]}
        />
      )}

      {tieneIntermedios && (
        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-1">Departamentos intermedios</p>
          <p className="text-sm text-gray-700">{resultado.departamentosIntermedios!.join(', ')}</p>
        </div>
      )}

      {estadoPdf === 'generado' ? (
        <div className="w-full mt-auto flex items-center justify-between gap-3 border border-marca-verde/30 bg-marca-verde/5 rounded-lg px-4 py-3">
          <span>
            <span className="block text-sm font-semibold text-marca-oscuro">{textoBoton.titulo}</span>
            <span className="block text-xs text-gray-500">{textoBoton.subtitulo}</span>
          </span>
          <button
            type="button"
            onClick={onDescargarPdf}
            className="shrink-0 flex items-center gap-1.5 bg-marca-oscuro text-white text-xs font-semibold px-3 py-2 rounded-lg hover:opacity-90 transition"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Descargar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onSolicitarTornaguia}
          className="w-full mt-auto flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-left border border-marca-medio/30 bg-marca-medio/5 hover:bg-marca-medio/10 transition"
        >
          <span>
            <span className="block text-sm font-semibold text-marca-oscuro">{textoBoton.titulo}</span>
            <span className="block text-xs text-gray-500">{textoBoton.subtitulo}</span>
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-4 h-4 shrink-0 text-marca-medio"
          >
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {onNuevaSolicitud && (
        <button
          type="button"
          onClick={onNuevaSolicitud}
          className="w-full mt-4 bg-marca-oscuro text-white font-semibold py-3 rounded-lg hover:opacity-90 transition"
        >
          Nueva solicitud
        </button>
      )}
    </div>
  )
}
