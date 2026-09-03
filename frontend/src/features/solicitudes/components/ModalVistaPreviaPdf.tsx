import { useEffect, useMemo } from 'react'

interface ModalVistaPreviaPdfProps {
  titulo?: string
  bytes: Uint8Array
  onCerrar: () => void
  onDescargar?: () => void
}

export function ModalVistaPreviaPdf({ titulo, bytes, onCerrar, onDescargar }: ModalVistaPreviaPdfProps) {
  const url = useMemo(() => {
    const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
    return URL.createObjectURL(blob)
  }, [bytes])

  useEffect(() => () => URL.revokeObjectURL(url), [url])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-8"
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-4xl h-full max-h-[90vh] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-marca-oscuro truncate">
            {titulo ?? 'Vista previa de la tornaguía'}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {onDescargar && (
              <button
                type="button"
                onClick={onDescargar}
                className="flex items-center gap-1.5 bg-marca-oscuro text-white text-xs font-semibold px-3 py-2 rounded-lg hover:opacity-90 transition"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Descargar
              </button>
            )}
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar vista previa"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
        <iframe src={url} title={titulo ?? 'Vista previa de la tornaguía'} className="flex-1 w-full" />
      </div>
    </div>
  )
}
