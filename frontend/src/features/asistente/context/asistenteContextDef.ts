import { createContext } from 'react'
import type { SidebarItem } from '../../../shared/components/Sidebar'
import type { MensajeAsistente, PreguntarResponse } from '../types'

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
  /** Endpoint real (contribuyente o gerencial) — lo decide quien monta el AsistenteProvider. */
  preguntar: (pregunta: string, conversacionId: string) => Promise<PreguntarResponse>
  obtenerHistorial: () => Promise<MensajeAsistente[]>
  rutaHistorial: string
  sidebarItems: SidebarItem[]
}

export const AsistenteContext = createContext<AsistenteContextValue | null>(null)
