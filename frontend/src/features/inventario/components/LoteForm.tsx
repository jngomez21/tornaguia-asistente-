import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { getProductos } from '../../solicitudes/api/solicitudesApi'
import { getInventario } from '../api/inventarioApi'
import { loteFormSchema, loteFormPorDefecto, loteProductoPorDefecto } from '../schemas'
import type { LoteFormValues } from '../schemas'
import { LoteProductoField } from './LoteProductoField'
import { LoteProductoResumen } from './LoteProductoResumen'

interface LoteFormProps {
  valoresIniciales?: LoteFormValues
  textoBoton: string
  guardando?: boolean
  onGuardar: (values: LoteFormValues) => void
  onCancelar?: () => void
}

export function LoteForm({ valoresIniciales, textoBoton, guardando, onGuardar, onCancelar }: LoteFormProps) {
  const productosQuery = useQuery({ queryKey: ['productos'], queryFn: getProductos })
  const inventarioQuery = useQuery({ queryKey: ['inventario'], queryFn: getInventario })

  const disponiblePorProducto = Object.fromEntries(
    (inventarioQuery.data ?? []).map((i) => [i.productoId, i.cantidadDisponible]),
  )

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
  const indiceActivo = fields.length - 1

  const productoActivo = useWatch({ control, name: `productos.${indiceActivo}` })
  const puedeAgregarOtro = Boolean(productoActivo?.productoId) && Number(productoActivo?.cantidad) > 0

  return (
    <form onSubmit={handleSubmit(onGuardar)}>
      <LoteProductoField
        index={indiceActivo}
        control={control}
        register={register}
        setValue={setValue}
        errors={errors.productos}
        productos={productosQuery.data ?? []}
        productosCargando={productosQuery.isLoading}
        disponiblePorProducto={disponiblePorProducto}
        mostrarQuitar={fields.length > 1}
        onQuitar={() => remove(indiceActivo)}
      />

      <button
        type="button"
        onClick={() => append({ ...loteProductoPorDefecto })}
        disabled={!puedeAgregarOtro}
        className="w-full border border-dashed border-marca-medio text-marca-medio text-sm font-semibold py-2 rounded-lg hover:bg-marca-medio/5 transition mb-4 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        + Agregar otro producto
      </button>

      {fields.length > 1 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2">Ya agregados al lote</p>
          {fields.slice(0, -1).map((field, index) => (
            <LoteProductoResumen key={field.id} index={index} control={control} onQuitar={() => remove(index)} />
          ))}
        </div>
      )}

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
