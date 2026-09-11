import { colorSecuencial } from '../lib/colorSecuencial'

interface LeyendaCoropleticaProps {
  maximo: number
}

const PASOS = 6

// Reutiliza colorSecuencial (la misma rampa que pinta el mapa) para que la barra y los
// departamentos nunca puedan desincronizarse en dos lugares distintos.
export function LeyendaCoropletica({ maximo }: LeyendaCoropleticaProps) {
  if (maximo <= 0) return null

  const pasos = Array.from({ length: PASOS }, (_, i) => colorSecuencial(i / (PASOS - 1)))

  return (
    <div className="absolute bottom-3 left-3 bg-white/95 rounded-lg px-3 py-2 shadow-sm">
      <p className="text-[10px] font-semibold text-gray-500 mb-1.5">Tornaguías</p>
      <div className="flex h-2 w-32 overflow-hidden rounded-sm">
        {pasos.map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-500 mt-1 tabular-nums">
        <span>0</span>
        <span>{maximo.toLocaleString('es-CO')}</span>
      </div>
    </div>
  )
}
