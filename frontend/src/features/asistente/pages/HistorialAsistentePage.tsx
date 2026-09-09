import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from '../../../shared/components/Sidebar'
import { formatearFecha, truncarTexto } from '../../../shared/lib/formato'
import { useAsistente } from '../context/useAsistente'
import { ConversacionAsistente } from '../components/ConversacionAsistente'
import type { MensajeAsistente } from '../types'

const LONGITUD_PREVIEW = 45

interface ConversacionListada {
  id: string
  mensajes: MensajeAsistente[]
}

function IconoNuevo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}

export function HistorialAsistentePage() {
  const { continuarConHistorial, limpiar, obtenerHistorial, sidebarItems, rutaHistorial } = useAsistente()
  const historialQuery = useQuery({ queryKey: ['asistente-historial', rutaHistorial], queryFn: obtenerHistorial })
  const [seleccionada, setSeleccionada] = useState<string | null>(null)

  const conversaciones = useMemo<ConversacionListada[]>(() => {
    if (!historialQuery.data) return []

    const porConversacion = new Map<string, MensajeAsistente[]>()
    for (const mensaje of historialQuery.data) {
      const lista = porConversacion.get(mensaje.conversacionId) ?? []
      lista.push(mensaje)
      porConversacion.set(mensaje.conversacionId, lista)
    }

    return Array.from(porConversacion.entries())
      .map(([id, mensajes]) => ({ id, mensajes }))
      .sort((a, b) => {
        const fechaA = a.mensajes[a.mensajes.length - 1].fechaCreacion
        const fechaB = b.mensajes[b.mensajes.length - 1].fechaCreacion
        return new Date(fechaB).getTime() - new Date(fechaA).getTime()
      })
  }, [historialQuery.data])

  function seleccionar(conversacion: ConversacionListada) {
    setSeleccionada(conversacion.id)
    continuarConHistorial(conversacion.mensajes, conversacion.id)
  }

  function nuevaConversacion() {
    setSeleccionada(null)
    limpiar()
  }

  return (
    <div className="h-dvh flex bg-gray-50">
      <Sidebar items={sidebarItems} />

      <main className="flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full flex flex-col p-6 sm:p-10">
          <h1 className="text-2xl font-bold text-marca-oscuro mb-1 text-center">Tornaguías ChatBot</h1>
          <p className="text-sm text-gray-500 mb-6 text-center">Conversaciones que has tenido con el asistente.</p>

          <div className="flex-1 min-h-0 flex bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="w-72 shrink-0 border-r border-gray-100 flex flex-col">
              <div className="p-3 border-b border-gray-100">
                <button
                  type="button"
                  onClick={nuevaConversacion}
                  className="w-full flex items-center justify-center gap-2 bg-marca-medio text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-marca-medio/90 transition"
                >
                  <IconoNuevo />
                  Nueva conversación
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {historialQuery.isLoading && <p className="text-sm text-gray-500 px-4 py-4">Cargando...</p>}

                {historialQuery.isError && (
                  <p className="text-sm text-red-600 px-4 py-4">No se pudo cargar el historial.</p>
                )}

                {historialQuery.data && conversaciones.length === 0 && (
                  <p className="text-sm text-gray-500 px-4 py-4">Aún no has tenido conversaciones con el asistente.</p>
                )}

                {conversaciones.map((conversacion) => {
                  const primeraPregunta = conversacion.mensajes.find((m) => m.rol === 'usuario')
                  const ultimoMensaje = conversacion.mensajes[conversacion.mensajes.length - 1]

                  return (
                    <button
                      key={conversacion.id}
                      type="button"
                      onClick={() => seleccionar(conversacion)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-50 transition ${
                        seleccionada === conversacion.id ? 'bg-marca-medio/10' : 'hover:bg-gray-50'
                      }`}
                    >
                      <p className="text-sm text-gray-700 truncate">
                        {primeraPregunta ? truncarTexto(primeraPregunta.contenido, LONGITUD_PREVIEW) : 'Conversación'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatearFecha(ultimoMensaje.fechaCreacion)}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
              <ConversacionAsistente
                contenidoVacio={
                  <p className="text-sm text-gray-400 text-center mt-4">
                    Selecciona una conversación de la izquierda para verla.
                  </p>
                }
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
