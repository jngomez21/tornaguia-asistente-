interface FiltroAnioProps {
  anios: number[]
  valor: number | null
  onChange: (anio: number | null) => void
}

// Un solo filtro por encima de todo lo que afecta: cada panel del tablero se redibuja contra el
// mismo año, en vez de tener un selector propio por gráfica.
export function FiltroAnio({ anios, valor, onChange }: FiltroAnioProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="filtro-anio" className="text-xs font-semibold text-gray-500">
        Período
      </label>
      <select
        id="filtro-anio"
        value={valor ?? 'todos'}
        onChange={(e) => onChange(e.target.value === 'todos' ? null : Number(e.target.value))}
        className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-marca-oscuro focus:outline-none focus:ring-2 focus:ring-marca-medio"
      >
        <option value="todos">Histórico completo</option>
        {anios.map((anio) => (
          <option key={anio} value={anio}>
            {anio}
          </option>
        ))}
      </select>
    </div>
  )
}
