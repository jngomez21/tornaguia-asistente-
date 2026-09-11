import { useState } from 'react'
import type { ReactNode } from 'react'
import type { SidebarItem } from '../../../shared/components/Sidebar'
import type { MensajeAsistente, PreguntarResponse } from '../types'
import { AsistenteContext } from './asistenteContextDef'
import type { AsistenteContextValue, DocumentoChat } from './asistenteContextDef'

interface AsistenteProviderProps {
  children: ReactNode
  preguntar: (pregunta: string, conversacionId: string) => Promise<PreguntarResponse>
  obtenerHistorial: () => Promise<MensajeAsistente[]>
  rutaHistorial: string
  sidebarItems: SidebarItem[]
  abrirDocumento?: (doc: DocumentoChat) => void
}

export function AsistenteProvider({
  children,
  preguntar,
  obtenerHistorial,
  rutaHistorial,
  sidebarItems,
  abrirDocumento,
}: AsistenteProviderProps) {
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState<MensajeAsistente[]>([])
  const [conversacionId, setConversacionId] = useState<string>(() => crypto.randomUUID())

  const value: AsistenteContextValue = {
    abierto,
    mensajes,
    conversacionId,
    abrir: () => setAbierto(true),
    colapsar: () => setAbierto(false),
    cerrar: () => {
      setAbierto(false)
      setMensajes([])
      setConversacionId(crypto.randomUUID())
    },
    limpiar: () => {
      setMensajes([])
      setConversacionId(crypto.randomUUID())
    },
    continuarConHistorial: (historial, idConversacion) => {
      setMensajes(historial)
      setConversacionId(idConversacion)
      setAbierto(true)
    },
    agregarMensaje: (mensaje) => setMensajes((prev) => [...prev, mensaje]),
    preguntar,
    obtenerHistorial,
    rutaHistorial,
    sidebarItems,
    abrirDocumento,
  }

  return <AsistenteContext.Provider value={value}>{children}</AsistenteContext.Provider>
}
