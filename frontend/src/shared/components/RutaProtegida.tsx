import { Navigate, Outlet } from 'react-router-dom'
import { ChatAsistente } from '../../features/asistente/components/ChatAsistente'
import { AsistenteProvider } from '../../features/asistente/context/AsistenteContext'
import { getHistorialAsistente, preguntarAsistente } from '../../features/asistente/api/asistenteApi'
import { appSidebarItems } from './sidebarItems'

export function RutaProtegida() {
  const token = localStorage.getItem('token')
  const rol = localStorage.getItem('rol')

  if (!token) {
    return <Navigate to="/" replace />
  }

  if (rol === 'Ejecutivo') {
    return <Navigate to="/gerencial" replace />
  }

  return (
    <AsistenteProvider
      preguntar={preguntarAsistente}
      obtenerHistorial={getHistorialAsistente}
      rutaHistorial="/asistente/historial"
      sidebarItems={appSidebarItems}
    >
      <Outlet />
      <ChatAsistente />
    </AsistenteProvider>
  )
}
