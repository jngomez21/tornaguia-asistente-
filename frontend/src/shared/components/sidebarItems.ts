import type { SidebarItem } from './Sidebar'
import { sidebarIconos } from './sidebarIconos'

export const appSidebarItems: SidebarItem[] = [
  { key: 'inicio', label: 'Inicio', icon: sidebarIconos.inicio, to: '/inicio' },
  { key: 'nueva', label: 'Nueva solicitud', icon: sidebarIconos.nuevaSolicitud, to: '/solicitudes/nueva' },
  { key: 'historial', label: 'Historial de solicitudes', icon: sidebarIconos.historial, to: '/solicitudes/historial' },
  { key: 'lotes', label: 'Lotes', icon: sidebarIconos.lotes, to: '/inventario/lotes' },
  { key: 'bodegas', label: 'Bodegas', icon: sidebarIconos.bodegas, to: '/bodegas' },
]
