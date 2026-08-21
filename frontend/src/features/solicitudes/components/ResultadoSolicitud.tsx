import type { CrearSolicitudResponse } from '../types'

interface ResultadoSolicitudProps {
  resultado: CrearSolicitudResponse
  onNuevaSolicitud?: () => void
  titulo?: string
}

const colorPorTipo: Record<string, string> = {
  Movilización: 'bg-marca-medio',
  Reenvío: 'bg-marca-verde',
  Tránsito: 'bg-marca-oscuro',
}

export function ResultadoSolicitud({ resultado, onNuevaSolicitud, titulo }: ResultadoSolicitudProps) {
  const colorBadge = colorPorTipo[resultado.tipoTornaguia] ?? 'bg-marca-oscuro'
  const tieneIntermedios = (resultado.departamentosIntermedios?.length ?? 0) > 0

  return (
    <div className="w-full h-full flex flex-col">
      {titulo && (
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3 pb-3 border-b border-gray-100">
          {titulo}
        </p>
      )}
      <span
        className={`inline-block self-start ${colorBadge} text-white text-xs font-semibold px-3 py-1 rounded-full mb-4`}
      >
        Solicitud #{resultado.solicitudId}
      </span>

      <h1 className="text-2xl font-bold text-marca-oscuro mb-1">Tornaguía de {resultado.tipoTornaguia}</h1>
      <p className="text-sm text-gray-600 mb-6">{resultado.justificacion}</p>

      {tieneIntermedios && (
        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-1">Departamentos intermedios</p>
          <p className="text-sm text-gray-700">{resultado.departamentosIntermedios!.join(', ')}</p>
        </div>
      )}

      <button
        type="button"
        className="w-full mt-auto flex items-center justify-between gap-3 border border-marca-medio/30 bg-marca-medio/5 rounded-lg px-4 py-3 text-left hover:bg-marca-medio/10 transition"
      >
        <span>
          <span className="block text-sm font-semibold text-marca-oscuro">Solicitud de Tornaguía</span>
          <span className="block text-xs text-gray-500">Genera el PDF con los datos de esta tornaguía</span>
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
