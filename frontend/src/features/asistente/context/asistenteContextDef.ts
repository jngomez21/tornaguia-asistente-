import { createContext } from 'react'
import type { SidebarItem } from '../../../shared/components/Sidebar'
import type { MensajeAsistente, PreguntarResponse } from '../types'

/** Un enlace [Ver tornaguía #42](#tornaguia-42) o [Ver declaración #7](#declaracion-7) que el bot gerencial genera. */
export interface DocumentoChat {
  tipo: 'tornaguia' | 'declaracion'
  id: number
}

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
  /** Solo el bot gerencial la define; el chat de contribuyente pasa undefined y sus enlaces
   * siguen comportándose como enlaces normales — cero riesgo para ese bot. */
  abrirDocumento?: (doc: DocumentoChat) => void
}

export const AsistenteContext = createContext<AsistenteContextValue | null>(null)
