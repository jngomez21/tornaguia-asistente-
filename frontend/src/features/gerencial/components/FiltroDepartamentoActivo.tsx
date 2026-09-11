interface FiltroDepartamentoActivoProps {
  nombre: string
  onQuitar: () => void
}

/**
 * Nace y muere con la selección de un departamento en el mapa: no compite por espacio en la barra
 * de filtros cuando la vista es nacional. Sin toggle Origen/Destino: esa distinción es una regla
 * fija (tornaguías siempre por origen, impuesto siempre por destino), no una preferencia que el
 * usuario del tablero deba elegir — ver CriterioDepartamento en el backend.
 */
export function FiltroDepartamentoActivo({ nombre, onQuitar }: FiltroDepartamentoActivoProps) {
  return (
    <span className="flex items-center gap-1.5 bg-marca-oscuro/5 border border-marca-oscuro/20 rounded-full pl-3 pr-1.5 py-1 text-xs font-semibold text-marca-oscuro">
      {nombre}
      <button
        type="button"
        onClick={onQuitar}
        aria-label={`Quitar filtro de ${nombre}`}
        className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-marca-oscuro/10 transition"
      >
        ×
      </button>
    </span>
  )
}
