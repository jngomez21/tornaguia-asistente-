import { useState } from 'react'
import type { ReactNode } from 'react'
import type { MensajeAsistente } from '../types'
import { AsistenteContext } from './asistenteContextDef'
import type { AsistenteContextValue } from './asistenteContextDef'

export function AsistenteProvider({ children }: { children: ReactNode }) {
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState<MensajeAsistente[]>([])
  const [conversacionId, setConversacionId] = useState(() => crypto.randomUUID())

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
  }

  return <AsistenteContext.Provider value={value}>{children}</AsistenteContext.Provider>
}
