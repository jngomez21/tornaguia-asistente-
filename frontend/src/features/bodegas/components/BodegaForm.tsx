import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { getMunicipios } from '../../solicitudes/api/solicitudesApi'
import { BuscadorMunicipio } from '../../solicitudes/components/BuscadorMunicipio'
import { BuscadorDireccion } from './BuscadorDireccion'
import { bodegaFormSchema, bodegaFormPorDefecto } from '../schemas'
import type { BodegaFormValues } from '../schemas'

interface BodegaFormProps {
  valoresIniciales?: BodegaFormValues
  textoBoton: string
  guardando?: boolean
  onGuardar: (values: BodegaFormValues) => void
  onCancelar?: () => void
}

export function BodegaForm({ valoresIniciales, textoBoton, guardando, onGuardar, onCancelar }: BodegaFormProps) {
  const municipiosQuery = useQuery({ queryKey: ['municipios'], queryFn: getMunicipios })

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BodegaFormValues>({
    resolver: zodResolver(bodegaFormSchema),
    defaultValues: valoresIniciales ?? bodegaFormPorDefecto,
  })

  const municipioIdSeleccionado = useWatch({ control, name: 'municipioId' })
  const municipioSeleccionado = municipiosQuery.data?.find((m) => m.id === municipioIdSeleccionado)
  const centroMunicipio =
    municipioSeleccionado?.latitud != null && municipioSeleccionado?.longitud != null
      ? { latitud: municipioSeleccionado.latitud, longitud: municipioSeleccionado.longitud }
      : null

  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">Nombre de la bodega</label>
      <input
        type="text"
        placeholder="Ej: Bodega principal"
        {...register('nombre')}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 mb-1 focus:outline-none focus:ring-2 focus:ring-marca-medio"
      />
      {errors.nombre && <p className="text-xs text-red-600 mb-3">{errors.nombre.message}</p>}

      <label className="block text-sm text-gray-600 mb-1 mt-3">Municipio</label>
      <Controller
        control={control}
        name="municipioId"
        render={({ field }) => (
          <BuscadorMunicipio
            municipios={municipiosQuery.data ?? []}
            value={field.value}
            onChange={field.onChange}
            disabled={municipiosQuery.isLoading}
            placeholder={municipiosQuery.isLoading ? 'Cargando municipios...' : 'Busca un municipio'}
          />
        )}
      />
      {errors.municipioId && <p className="text-xs text-red-600 mb-3">{errors.municipioId.message}</p>}

      <label className="block text-sm text-gray-600 mb-1 mt-3">Dirección exacta (opcional)</label>
      <Controller
        control={control}
        name="direccion"
        render={({ field }) => (
          <BuscadorDireccion value={field.value} onChange={field.onChange} centroMunicipio={centroMunicipio} />
        )}
      />
      <p className="text-xs text-gray-400 mt-1">Se usa solo para ubicar el punto exacto en el mapa.</p>

      <div className="flex gap-3 mt-4">
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
          type="button"
          onClick={handleSubmit(onGuardar)}
          disabled={guardando}
          className="flex-1 bg-marca-oscuro text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : textoBoton}
        </button>
      </div>
    </div>
  )
}
