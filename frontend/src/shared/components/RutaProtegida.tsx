import { Navigate, Outlet } from 'react-router-dom'

export function RutaProtegida() {
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
