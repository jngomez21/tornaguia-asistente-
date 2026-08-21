import { Controller, useWatch } from 'react-hook-form'
import type { Control, UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form'
import { BuscadorProducto } from '../../solicitudes/components/BuscadorProducto'
import type { LoteFormValues } from '../schemas'
import type { Producto } from '../../solicitudes/types'

interface LoteProductoFieldProps {
  index: number
  control: Control<LoteFormValues>
  register: UseFormRegister<LoteFormValues>
  setValue: UseFormSetValue<LoteFormValues>
  errors: FieldErrors<LoteFormValues>['productos']
  productos: Producto[]
  productosCargando: boolean
  mostrarQuitar: boolean
  onQuitar: () => void
}

export function LoteProductoField({
  index,
  control,
  register,
  setValue,
  errors,
  productos,
  productosCargando,
  mostrarQuitar,
  onQuitar,
}: LoteProductoFieldProps) {
  const nombreSeleccionado = useWatch({ control, name: `productos.${index}.productoNombre` })
  const errorItem = errors?.[index]

  return (
    <div className="border border-gray-200 rounded-lg p-3 mb-3">
      <Controller
        control={control}
        name={`productos.${index}.productoId`}
        render={({ field }) => (
          <BuscadorProducto
            productos={productos}
            value={field.value}
            nombreSeleccionado={nombreSeleccionado}
            disabled={productosCargando}
            onChange={(id, nombre) => {
              field.onChange(id)
              setValue(`productos.${index}.productoNombre`, nombre)
            }}
          />
        )}
      />
      {errorItem?.productoId && <p className="text-xs text-red-600 mt-1">{errorItem.productoId.message}</p>}

      <div className="mt-3">
        <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
        <input
          type="number"
          step="any"
          {...register(`productos.${index}.cantidad`, { valueAsNumber: true })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marca-medio"
        />
        {errorItem?.cantidad && <p className="text-xs text-red-600 mt-1">{errorItem.cantidad.message}</p>}
      </div>

      {mostrarQuitar && (
        <button type="button" onClick={onQuitar} className="text-xs text-gray-400 hover:text-red-600 transition mt-2">
          Quitar producto
        </button>
      )}
    </div>
  )
}
