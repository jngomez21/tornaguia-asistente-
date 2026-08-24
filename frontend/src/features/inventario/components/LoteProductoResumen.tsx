import { useWatch } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import type { LoteFormValues } from '../schemas'

interface LoteProductoResumenProps {
  index: number
  control: Control<LoteFormValues>
  onQuitar: () => void
}

export function LoteProductoResumen({ index, control, onQuitar }: LoteProductoResumenProps) {
  const producto = useWatch({ control, name: `productos.${index}` })

  return (
    <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 mb-2 text-sm bg-gray-50">
      <span className="text-gray-700 truncate">
        {producto?.productoNombre || 'Producto'}
        <span className="text-gray-400"> — cant. {producto?.cantidad}</span>
      </span>
      <button
        type="button"
        onClick={onQuitar}
        className="text-xs text-gray-400 hover:text-red-600 transition shrink-0 ml-2"
      >
        Quitar
      </button>
    </div>
  )
}
