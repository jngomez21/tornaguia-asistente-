import type { SidebarItem } from '../../shared/components/Sidebar'
import { sidebarIconos } from '../../shared/components/sidebarIconos'

export const solicitudesSidebarItems: SidebarItem[] = [
  { key: 'nueva', label: 'Nueva solicitud', icon: sidebarIconos.nuevaSolicitud, to: '/solicitudes/nueva' },
  { key: 'historial', label: 'Historial de solicitudes', icon: sidebarIconos.historial, to: '/solicitudes/historial' },
  { key: 'lotes', label: 'Lotes', icon: sidebarIconos.lotes, to: '/inventario/lotes' },
]
