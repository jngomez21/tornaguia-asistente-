import { Navigate, Outlet } from 'react-router-dom'
import { ChatAsistente } from '../../features/asistente/components/ChatAsistente'
import { AsistenteProvider } from '../../features/asistente/context/AsistenteContext'

export function RutaProtegida() {
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/" replace />
  }

  return (
    <AsistenteProvider>
      <Outlet />
      <ChatAsistente />
    </AsistenteProvider>
  )
}
