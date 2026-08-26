import { useState } from 'react'
import { explicacionPorTipo, type TipoTornaguia } from '../lib/tiposTornaguia'
import { colorPorTipo } from '../lib/coloresTornaguia'

const tipos: TipoTornaguia[] = ['Movilización', 'Reenvío', 'Tránsito']

function IconoInfo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 shrink-0 text-marca-medio">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 8v.01" strokeLinecap="round" />
    </svg>
  )
}

function IconoChevron({ abierto }: { abierto: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={`w-4 h-4 text-gray-400 transition-transform ${abierto ? 'rotate-180' : ''}`}
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ListaTipos() {
  return (
    <>
      {tipos.map((tipo) => (
        <div key={tipo} className="flex items-start gap-3 rounded-lg px-3 py-2.5">
          <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${colorPorTipo[tipo]}`} />
          <div>
            <p className="text-sm font-semibold text-gray-600">{tipo}</p>
            <p className="text-xs text-gray-500">{explicacionPorTipo[tipo]}</p>
          </div>
        </div>
      ))}
    </>
  )
}

interface BotonProps {
  abierto: boolean
  onClick: () => void
  compacto?: boolean
}

/** Solo el botón disparador — para usarlo separado del panel (p. ej. alineado con otro elemento). */
export function BotonExplicacionTipoTornaguia({ abierto, onClick, compacto = false }: BotonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={abierto}
      className={`w-full flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl shadow-sm px-5 text-left ${
        compacto ? 'py-2' : 'py-4'
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-marca-oscuro">
        <IconoInfo />
        ¿Cómo se determina el tipo?
      </span>
      <IconoChevron abierto={abierto} />
    </button>
  )
}

interface PanelProps {
  abierto: boolean
  /**
   * Ref al contenido interno (no al contenedor que anima su alto). El contenido
   * siempre tiene su altura natural completa aunque esté visualmente colapsado
   * por el `overflow-hidden` del padre, así que sirve para medir un valor fijo
   * (el alto ya abierto) en vez de perseguir el alto animándose cuadro a cuadro.
   */
  contenidoRef?: React.Ref<HTMLDivElement>
}

/** Solo el contenido expandible — para colocarlo en un lugar distinto al del botón que lo controla. */
export function PanelExplicacionTipoTornaguia({ abierto, contenidoRef }: PanelProps) {
  return (
    <div className={`grid transition-all duration-300 ease-out ${abierto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
      <div className="overflow-hidden">
        <div ref={contenidoRef} className="flex flex-col gap-2.5 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500">
            Existen 3 tipos de tornaguía. Se calculan según el origen, el destino y si el producto ya fue
            declarado. El tipo exacto se confirma al consultar.
          </p>
          <ListaTipos />
        </div>
      </div>
    </div>
  )
}

interface ExplicacionTipoTornaguiaProps {
  /** Botón más bajo, para alinearse en altura con el toggle Tornaguía/Tornaguías. */
  compacto?: boolean
}

/** Versión autocontenida: botón + panel unidos en una sola card. Crece hacia abajo al abrirse. */
export function ExplicacionTipoTornaguia({ compacto = false }: ExplicacionTipoTornaguiaProps) {
  const [abierto, setAbierto] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className={`w-full flex items-center justify-between gap-3 px-5 text-left ${compacto ? 'py-2' : 'py-4'}`}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-marca-oscuro">
          <IconoInfo />
          ¿Cómo se determina el tipo?
        </span>
        <IconoChevron abierto={abierto} />
      </button>

      <div className={`grid transition-all duration-300 ease-out ${abierto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="flex flex-col gap-2.5 px-5 pb-5 pt-1 border-t border-gray-100">
            <p className="text-xs text-gray-500 pt-4">
              Existen 3 tipos de tornaguía. Se calculan según el origen, el destino y si el producto ya fue
              declarado. El tipo exacto se confirma al consultar.
            </p>
            <ListaTipos />
          </div>
        </div>
      </div>
    </div>
  )
}
