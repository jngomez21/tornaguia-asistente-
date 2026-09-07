import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { extraerMensajeAxios } from '../../../shared/lib/errores'
import { preguntarAsistente } from '../api/asistenteApi'
import { useAsistente } from '../context/useAsistente'
import { MensajeContenido } from './MensajeContenido'

function IconoEnviar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

interface ConversacionAsistenteProps {
  contenidoVacio: ReactNode
}

export function ConversacionAsistente({ contenidoVacio }: ConversacionAsistenteProps) {
  const { mensajes, conversacionId, agregarMensaje } = useAsistente()
  const [pregunta, setPregunta] = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const finRef = useRef<HTMLDivElement>(null)

  const mutation = useMutation({
    mutationFn: (texto: string) => preguntarAsistente(texto, conversacionId),
    onMutate: (texto: string) => {
      setEscribiendo(true)
      agregarMensaje({ rol: 'usuario', contenido: texto, fechaCreacion: new Date().toISOString(), conversacionId })
    },
    onSuccess: (data) => {
      agregarMensaje({
        rol: 'asistente',
        contenido: data.respuesta,
        fechaCreacion: new Date().toISOString(),
        conversacionId,
      })
    },
    onError: (error) => {
      const mensaje = extraerMensajeAxios(error) ?? 'No se pudo obtener respuesta. Intenta de nuevo.'
      agregarMensaje({ rol: 'asistente', contenido: mensaje, fechaCreacion: new Date().toISOString(), conversacionId })
    },
    onSettled: () => setEscribiendo(false),
  })

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes.length, escribiendo])

  function enviar() {
    const texto = pregunta.trim()
    if (!texto || mutation.isPending) return
    mutation.mutate(texto)
    setPregunta('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50">
        {mensajes.length === 0 && contenidoVacio}

        {mensajes.map((mensaje, i) => (
          <div key={i} className={`flex ${mensaje.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] text-sm rounded-xl px-3 py-2 ${
                mensaje.rol === 'usuario'
                  ? 'bg-marca-medio text-white rounded-br-sm whitespace-pre-wrap'
                  : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm'
              }`}
            >
              {mensaje.rol === 'usuario' ? mensaje.contenido : <MensajeContenido contenido={mensaje.contenido} />}
            </div>
          </div>
        ))}

        {escribiendo && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-xl rounded-bl-sm px-3 py-2 text-sm text-gray-400">
              Escribiendo...
            </div>
          </div>
        )}

        <div ref={finRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-gray-100 p-2 shrink-0">
        <input
          type="text"
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') enviar()
          }}
          placeholder="Escribe tu pregunta..."
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marca-medio"
        />
        <button
          type="button"
          onClick={enviar}
          disabled={!pregunta.trim() || mutation.isPending}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-marca-medio text-white disabled:opacity-40 hover:bg-marca-medio/90 transition"
        >
          <IconoEnviar />
        </button>
      </div>
    </div>
  )
}
