import type { SidebarItem } from './Sidebar'
import { sidebarIconos } from './sidebarIconos'

export const gerencialSidebarItems: SidebarItem[] = [
  { key: 'dashboard', label: 'Tablero', icon: sidebarIconos.dashboard, to: '/gerencial' },
  { key: 'asistente', label: 'Asistente gerencial', icon: sidebarIconos.asistente, to: '/gerencial/asistente/historial' },
]
