import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { ChatAsistente } from '../../features/asistente/components/ChatAsistente'
import { AsistenteProvider } from '../../features/asistente/context/AsistenteContext'
import type { DocumentoChat } from '../../features/asistente/context/asistenteContextDef'
import { getHistorialAsistenteGerencial, preguntarAsistenteGerencial } from '../../features/gerencial/api/asistenteGerencialApi'
import { getDocumentoDeclaracion, getPdfSolicitudGerencial } from '../../features/gerencial/api/gerencialApi'
import { descargarDocumento } from '../../features/gerencial/lib/descargarDocumento'
import { ModalVistaPreviaPdf } from '../../features/solicitudes/components/ModalVistaPreviaPdf'
import { gerencialSidebarItems } from './sidebarItemsGerencial'

interface DocumentoAbierto {
  titulo: string
  bytes: Uint8Array
  contentType: string
  nombreArchivo: string
}

export function RutaEjecutiva() {
  const [documento, setDocumento] = useState<DocumentoAbierto | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const token = localStorage.getItem('token')
  const rol = localStorage.getItem('rol')

  async function abrirDocumento(doc: DocumentoChat) {
    if (cargando) return
    setCargando(true)
    setError(null)
    try {
      if (doc.tipo === 'tornaguia') {
        const bytes = await getPdfSolicitudGerencial(doc.id)
        setDocumento({
          titulo: `Tornaguía #${doc.id}`,
          bytes,
          contentType: 'application/pdf',
          nombreArchivo: `tornaguia-${doc.id}.pdf`,
        })
      } else {
        const { bytes, contentType, nombreArchivo } = await getDocumentoDeclaracion(doc.id)
        setDocumento({ titulo: `Declaración #${doc.id}`, bytes, contentType, nombreArchivo })
      }
    } catch {
      // El bot ya respondió cuando se pulsa el botón, así que un fallo aquí no llega por su
      // conversación: sin este aviso, el clic no produciría absolutamente nada visible.
      setError(
        doc.tipo === 'tornaguia'
          ? `No se pudo abrir el PDF de la tornaguía #${doc.id}. Puede que aún no se haya generado.`
          : `No se pudo abrir el documento de la declaración #${doc.id}.`,
      )
    } finally {
      setCargando(false)
    }
  }

  if (!token) {
    return <Navigate to="/" replace />
  }

  if (rol !== 'Ejecutivo') {
    return <Navigate to="/inicio" replace />
  }

  return (
    <AsistenteProvider
      preguntar={preguntarAsistenteGerencial}
      obtenerHistorial={getHistorialAsistenteGerencial}
      rutaHistorial="/gerencial/asistente/historial"
      sidebarItems={gerencialSidebarItems}
      abrirDocumento={abrirDocumento}
    >
      <Outlet />
      <ChatAsistente />

      {/* Centrado abajo: libra el sidebar (izquierda) y el widget de chat (derecha, bottom-0). */}
      {(cargando || error) && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg border bg-white border-gray-200"
        >
          {cargando ? (
            <>
              <span className="mt-0.5 w-4 h-4 shrink-0 rounded-full border-2 border-marca-medio border-t-transparent animate-spin" />
              <span className="text-sm text-gray-700">Abriendo documento...</span>
            </>
          ) : (
            <>
              <span className="text-sm text-red-700">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="ml-auto text-xs font-semibold text-gray-500 hover:text-gray-700 shrink-0"
              >
                Cerrar
              </button>
            </>
          )}
        </div>
      )}

      {documento && (
        <ModalVistaPreviaPdf
          titulo={documento.titulo}
          bytes={documento.bytes}
          contentType={documento.contentType}
          onCerrar={() => setDocumento(null)}
          onDescargar={() => descargarDocumento(documento.bytes, documento.contentType, documento.nombreArchivo)}
        />
      )}
    </AsistenteProvider>
  )
}
