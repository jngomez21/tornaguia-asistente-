import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { getProductos } from '../../solicitudes/api/solicitudesApi'
import { loteFormSchema, loteFormPorDefecto, loteProductoPorDefecto } from '../schemas'
import type { LoteFormValues } from '../schemas'
import { LoteProductoField } from './LoteProductoField'

interface LoteFormProps {
  valoresIniciales?: LoteFormValues
  textoBoton: string
  guardando?: boolean
  onGuardar: (values: LoteFormValues) => void
  onCancelar?: () => void
}

export function LoteForm({ valoresIniciales, textoBoton, guardando, onGuardar, onCancelar }: LoteFormProps) {
  const productosQuery = useQuery({ queryKey: ['productos'], queryFn: getProductos })

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoteFormValues>({
    resolver: zodResolver(loteFormSchema),
    defaultValues: valoresIniciales ?? loteFormPorDefecto,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'productos' })

  return (
    <form onSubmit={handleSubmit(onGuardar)}>
      {fields.map((field, index) => (
        <LoteProductoField
          key={field.id}
          index={index}
          control={control}
          register={register}
          setValue={setValue}
          errors={errors.productos}
          productos={productosQuery.data ?? []}
          productosCargando={productosQuery.isLoading}
          mostrarQuitar={fields.length > 1}
          onQuitar={() => remove(index)}
        />
      ))}

      <button
        type="button"
        onClick={() => append({ ...loteProductoPorDefecto })}
        className="w-full border border-dashed border-marca-medio text-marca-medio text-sm font-semibold py-2 rounded-lg hover:bg-marca-medio/5 transition mb-4"
      >
        + Agregar otro producto
      </button>

      <div className="flex gap-3">
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={guardando}
          className="flex-1 bg-marca-oscuro text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : textoBoton}
        </button>
      </div>
    </form>
  )
}
