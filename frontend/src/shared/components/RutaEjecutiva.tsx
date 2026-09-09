import { Navigate, Outlet } from 'react-router-dom'
import { ChatAsistente } from '../../features/asistente/components/ChatAsistente'
import { AsistenteProvider } from '../../features/asistente/context/AsistenteContext'
import { getHistorialAsistenteGerencial, preguntarAsistenteGerencial } from '../../features/gerencial/api/asistenteGerencialApi'
import { gerencialSidebarItems } from './sidebarItemsGerencial'

export function RutaEjecutiva() {
  const token = localStorage.getItem('token')
  const rol = localStorage.getItem('rol')

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
    >
      <Outlet />
      <ChatAsistente />
    </AsistenteProvider>
  )
}
