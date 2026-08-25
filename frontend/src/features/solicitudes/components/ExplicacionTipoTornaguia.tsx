import { useState } from 'react'
import { explicacionPorTipo, type TipoTornaguia } from '../lib/tiposTornaguia'
import { colorPorTipo } from '../lib/coloresTornaguia'

const tipos: TipoTornaguia[] = ['Movilización', 'Reenvío', 'Tránsito']

export function ExplicacionTipoTornaguia() {
  const [abierto, setAbierto] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-marca-oscuro">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 shrink-0 text-marca-medio">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5.5M12 8v.01" strokeLinecap="round" />
          </svg>
          ¿Cómo se determina el tipo?
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className={`w-4 h-4 text-gray-400 transition-transform ${abierto ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className={`grid transition-all duration-300 ease-out ${abierto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="flex flex-col gap-2.5 px-5 pb-5 pt-1 border-t border-gray-100">
            <p className="text-xs text-gray-500 pt-4">
              Existen 3 tipos de tornaguía. Se calculan según el origen, el destino y si el producto ya fue
              declarado. El tipo exacto se confirma al consultar.
            </p>

            {tipos.map((tipo) => (
              <div key={tipo} className="flex items-start gap-3 rounded-lg px-3 py-2.5">
                <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${colorPorTipo[tipo]}`} />
                <div>
                  <p className="text-sm font-semibold text-gray-600">{tipo}</p>
                  <p className="text-xs text-gray-500">{explicacionPorTipo[tipo]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
