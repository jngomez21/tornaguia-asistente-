import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import logoMarca from '../../assets/LogoMarca.png'

export interface SidebarItem {
  key: string
  label: string
  icon: ReactNode
  to?: string
  disabled?: boolean
}

interface SidebarProps {
  items: SidebarItem[]
  extra?: ReactNode
}

export function Sidebar({ items, extra }: SidebarProps) {
  const navigate = useNavigate()
  const nombre = localStorage.getItem('nombre')

  function cerrarSesion() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuarioId')
    localStorage.removeItem('nombre')
    navigate('/')
  }

  return (
    <aside className="hidden sm:flex w-64 shrink-0 h-dvh sticky top-0 flex-col bg-marca-oscuro text-white">
      <div className="px-6 py-6 border-b border-white/10 flex items-center gap-3">
        <img src={logoMarca} alt="" className="w-9 h-9 shrink-0 object-contain" />
        <div>
          <p className="text-lg font-bold leading-tight">TornaGuía</p>
          <p className="text-xs text-white/60">Asistente de tornaguías</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) =>
          item.disabled || !item.to ? (
            <span
              key={item.key}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 cursor-not-allowed"
              title="Próximamente"
            >
              {item.icon}
              {item.label}
            </span>
          ) : (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ),
        )}
      </nav>

      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        {extra}
        {nombre && <p className="px-3 pb-1 text-xs text-white/50 truncate">{nombre}</p>}
        <button
          type="button"
          onClick={cerrarSesion}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <path d="M15 17l5-5-5-5M20 12H9M12 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
