import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getProductos } from '../../solicitudes/api/solicitudesApi'
import { BuscadorProducto } from '../../solicitudes/components/BuscadorProducto'
import { registrarEntrada } from '../api/inventarioApi'
import { entradaSchema, entradaPorDefecto } from '../schemas'
import type { EntradaFormValues } from '../schemas'
import { extraerMensajeAxios } from '../../../shared/lib/errores'

interface EntradaFormProps {
  bodegaId: number
}

export function EntradaForm({ bodegaId }: EntradaFormProps) {
  const queryClient = useQueryClient()
  const productosQuery = useQuery({ queryKey: ['productos'], queryFn: getProductos })

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EntradaFormValues>({
    resolver: zodResolver(entradaSchema),
    defaultValues: entradaPorDefecto,
  })

  const nombreSeleccionado = useWatch({ control, name: 'productoNombre' })

  const entradaMutation = useMutation({
    mutationFn: registrarEntrada,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario', bodegaId] })
      reset(entradaPorDefecto)
    },
  })

  function onSubmit(values: EntradaFormValues) {
    entradaMutation.mutate({ bodegaId, productoId: values.productoId!, cantidad: values.cantidad })
  }

  const mensajeError = entradaMutation.error
    ? (extraerMensajeAxios(entradaMutation.error) ?? 'No se pudo registrar la entrada.')
    : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
      <h2 className="text-sm font-bold text-marca-oscuro mb-3">Registrar entrada de mercancía</h2>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px_auto] gap-3 items-start">
        <div>
          <Controller
            control={control}
            name="productoId"
            render={({ field }) => (
              <BuscadorProducto
                productos={productosQuery.data ?? []}
                value={field.value}
                nombreSeleccionado={nombreSeleccionado}
                disabled={productosQuery.isLoading}
                onChange={(id, nombre) => {
                  field.onChange(id)
                  setValue('productoNombre', nombre)
                }}
              />
            )}
          />
          {errors.productoId && <p className="text-xs text-red-600 mt-1">{errors.productoId.message}</p>}
        </div>
        <div>
          <input
            type="number"
            step="any"
            placeholder="Cantidad"
            {...register('cantidad', { valueAsNumber: true })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-marca-medio"
          />
          {errors.cantidad && <p className="text-xs text-red-600 mt-1">{errors.cantidad.message}</p>}
        </div>
        <button
          type="submit"
          disabled={entradaMutation.isPending}
          className="bg-marca-oscuro text-white font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          {entradaMutation.isPending ? 'Guardando...' : 'Registrar entrada'}
        </button>
      </div>
      {mensajeError && <p className="text-xs text-red-600 mt-2">{mensajeError}</p>}
    </form>
  )
}
