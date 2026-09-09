import { createContext } from 'react'
import type { MensajeAsistente } from '../types'

export interface AsistenteContextValue {
  abierto: boolean
  mensajes: MensajeAsistente[]
  conversacionId: string
  abrir: () => void
  cerrar: () => void
  /** Oculta el widget sin borrar la conversación (a diferencia de cerrar). */
  colapsar: () => void
  limpiar: () => void
  continuarConHistorial: (historial: MensajeAsistente[], conversacionId: string) => void
  agregarMensaje: (mensaje: MensajeAsistente) => void
}

export const AsistenteContext = createContext<AsistenteContextValue | null>(null)
