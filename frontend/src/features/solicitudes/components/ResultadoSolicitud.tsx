import type { CrearSolicitudResponse } from '../types'

interface ResultadoSolicitudProps {
  resultado: CrearSolicitudResponse
  onNuevaSolicitud: () => void
}

const colorPorTipo: Record<string, string> = {
  Movilización: 'bg-marca-medio',
  Reenvío: 'bg-marca-verde',
  Tránsito: 'bg-marca-oscuro',
}

export function ResultadoSolicitud({ resultado, onNuevaSolicitud }: ResultadoSolicitudProps) {
  const colorBadge = colorPorTipo[resultado.tipoTornaguia] ?? 'bg-marca-oscuro'
  const tieneDatosRuta = resultado.distanciaKm != null || resultado.tiempoEstimadoMinutos != null
  const tieneIntermedios = (resultado.departamentosIntermedios?.length ?? 0) > 0

  return (
    <div className="w-full max-w-md">
      <span className={`inline-block ${colorBadge} text-white text-xs font-semibold px-3 py-1 rounded-full mb-4`}>
        Solicitud #{resultado.solicitudId}
      </span>

      <h1 className="text-2xl font-bold text-marca-oscuro mb-1">{resultado.tipoTornaguia}</h1>
      <p className="text-sm text-gray-600 mb-6">{resultado.justificacion}</p>

      {tieneDatosRuta && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {resultado.distanciaKm != null && (
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500">Distancia</p>
              <p className="text-lg font-semibold text-marca-oscuro">
                {resultado.distanciaKm.toFixed(1)} km
              </p>
            </div>
          )}
          {resultado.tiempoEstimadoMinutos != null && (
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500">Tiempo estimado</p>
              <p className="text-lg font-semibold text-marca-oscuro">
                {Math.round((resultado.tiempoEstimadoMinutos / 60) * 10) / 10} h
              </p>
            </div>
          )}
        </div>
      )}

      {tieneIntermedios && (
        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-1">Departamentos intermedios</p>
          <p className="text-sm text-gray-700">{resultado.departamentosIntermedios!.join(', ')}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onNuevaSolicitud}
        className="w-full bg-marca-oscuro text-white font-semibold py-3 rounded-lg hover:opacity-90 transition"
      >
        Nueva solicitud
      </button>
    </div>
  )
}
