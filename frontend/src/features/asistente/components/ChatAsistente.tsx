import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAsistente } from '../context/useAsistente'
import { ConversacionAsistente } from './ConversacionAsistente'

const RUTA_HISTORIAL = '/asistente/historial'

function IconoChat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path d="M12 8V4" strokeLinecap="round" />
      <circle cx="12" cy="3" r="1" fill="currentColor" stroke="none" />
      <rect x="4" y="8" width="16" height="12" rx="2.5" />
      <path d="M2 12h2M20 12h2" strokeLinecap="round" />
      <circle cx="9" cy="14" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconoCerrar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  )
}

function IconoLimpiar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M4 7h16M9 7V4h6v3m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChatAsistente() {
  const location = useLocation()
  const { abierto, mensajes, abrir, cerrar, colapsar, limpiar } = useAsistente()
  const [pathnameAnterior, setPathnameAnterior] = useState(location.pathname)

  // Ajuste de estado durante el render (patrón oficial de React, sin useEffect) para que el
  // colapso ocurra antes de pintar y no se vea un frame con el widget abierto. Al salir de
  // "Tornaguías ChatBot" hacia cualquier otra vista, el widget debe verse colapsado sin importar
  // si se dejó abierto ahí — pero sin perder la conversación (colapsar, no cerrar).
  if (location.pathname !== pathnameAnterior) {
    if (pathnameAnterior === RUTA_HISTORIAL) colapsar()
    setPathnameAnterior(location.pathname)
  }

  if (location.pathname === RUTA_HISTORIAL) return null

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={abrir}
        className="fixed bottom-0 right-6 z-40 flex items-center gap-2 bg-marca-oscuro text-white px-4 py-3 rounded-t-xl shadow-lg hover:bg-marca-oscuro/90 transition"
      >
        <IconoChat />
        <span className="text-sm font-semibold">Asistente</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 right-6 z-40 w-80 sm:w-96 h-[28rem] max-h-[70vh] bg-white border border-gray-200 rounded-t-xl shadow-xl flex flex-col overflow-hidden animate-fade-slide-up">
      <button
        type="button"
        onClick={cerrar}
        title="Cerrar"
        className="flex items-center justify-between gap-2 bg-marca-oscuro text-white px-4 py-3 shrink-0"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <IconoChat />
          Asistente
        </span>
        <div className="flex items-center gap-3">
          {mensajes.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                limpiar()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation()
                  limpiar()
                }
              }}
              title="Limpiar conversación"
              className="text-white/70 hover:text-white transition"
            >
              <IconoLimpiar />
            </span>
          )}
          <IconoCerrar />
        </div>
      </button>

      <ConversacionAsistente
        contenidoVacio={
          <div className="text-center mt-4">
            <p className="text-xs text-gray-400">
              Pregúntame sobre tus bodegas, inventario, solicitudes, o sobre tornaguías en general.
            </p>
            <Link to={RUTA_HISTORIAL} className="text-xs font-semibold text-marca-medio hover:underline">
              Ver historial completo
            </Link>
          </div>
        }
      />
    </div>
  )
}
