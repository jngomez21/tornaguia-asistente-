import { useEffect } from 'react'
import { Controller, useWatch } from 'react-hook-form'
import type { Control, UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form'
import { BuscadorMunicipio } from './BuscadorMunicipio'
import type { NuevaSolicitudFormValues } from '../schemas'
import type { Municipio, Pais } from '../types'

interface SolicitudFormItemProps {
  index: number
  control: Control<NuevaSolicitudFormValues>
  register: UseFormRegister<NuevaSolicitudFormValues>
  setValue: UseFormSetValue<NuevaSolicitudFormValues>
  errors: FieldErrors<NuevaSolicitudFormValues>['solicitudes']
  municipios: Municipio[]
  municipiosCargando: boolean
  paises: Pais[]
  paisesCargando: boolean
  mostrarQuitar: boolean
  onQuitar: () => void
  titulo: string
  activa?: boolean
  onActivar?: () => void
}

export function SolicitudFormItem({
  index,
  control,
  register,
  setValue,
  errors,
  municipios,
  municipiosCargando,
  paises,
  paisesCargando,
  mostrarQuitar,
  onQuitar,
  titulo,
  activa = false,
  onActivar,
}: SolicitudFormItemProps) {
  const tipoDestino = useWatch({ control, name: `solicitudes.${index}.tipoDestino` })
  const municipioOrigenId = useWatch({ control, name: `solicitudes.${index}.municipioOrigenId` })
  const municipioDestinoId = useWatch({ control, name: `solicitudes.${index}.municipioDestinoId` })

  const errorItem = errors?.[index]

  useEffect(() => {
    if (tipoDestino === 'pais') {
      setValue(`solicitudes.${index}.esParaExportacion`, true)
      setValue(`solicitudes.${index}.municipioDestinoId`, undefined)
    } else {
      setValue(`solicitudes.${index}.paisDestinoId`, undefined)
    }
  }, [tipoDestino, index, setValue])

  useEffect(() => {
    if (municipioDestinoId != null && municipioDestinoId === municipioOrigenId) {
      setValue(`solicitudes.${index}.municipioDestinoId`, undefined)
    }
  }, [municipioOrigenId, municipioDestinoId, index, setValue])

  return (
    <div onClick={onActivar} className="h-full border border-gray-200 rounded-xl p-5 bg-white/60">
      {(titulo || mostrarQuitar || onActivar) && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-marca-oscuro flex items-center gap-2">
            {titulo}
            {activa && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-marca-medio bg-marca-medio/10 px-2 py-0.5 rounded-full">
                Activa
              </span>
            )}
          </h2>
          {mostrarQuitar && (
            <button
              type="button"
              onClick={onQuitar}
              className="text-xs text-gray-400 hover:text-red-600 transition"
            >
              Quitar
            </button>
          )}
        </div>
      )}

      <label className="block text-sm text-gray-600 mb-1">Municipio de origen</label>
      <Controller
        control={control}
        name={`solicitudes.${index}.municipioOrigenId`}
        render={({ field }) => (
          <BuscadorMunicipio
            municipios={municipios}
            value={field.value}
            onChange={field.onChange}
            disabled={municipiosCargando}
            placeholder={municipiosCargando ? 'Cargando municipios...' : 'Busca un municipio'}
          />
        )}
      />
      {errorItem?.municipioOrigenId && (
        <p className="text-sm text-red-600 mb-3">{errorItem.municipioOrigenId.message}</p>
      )}

      <label className="block text-sm text-gray-600 mb-1 mt-3">Tipo de destino</label>
      <div className="flex gap-4 mb-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="radio" value="municipio" {...register(`solicitudes.${index}.tipoDestino`)} />
          Municipio en Colombia
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="radio" value="pais" {...register(`solicitudes.${index}.tipoDestino`)} />
          País (exportación terrestre)
        </label>
      </div>

      {tipoDestino === 'municipio' ? (
        <>
          <label className="block text-sm text-gray-600 mb-1">Municipio de destino</label>
          <Controller
            control={control}
            name={`solicitudes.${index}.municipioDestinoId`}
            render={({ field }) => (
              <BuscadorMunicipio
                municipios={municipios}
                value={field.value}
                onChange={field.onChange}
                excludeId={municipioOrigenId}
                disabled={municipiosCargando}
                placeholder={municipiosCargando ? 'Cargando municipios...' : 'Busca un municipio'}
              />
            )}
          />
          {errorItem?.municipioDestinoId && (
            <p className="text-sm text-red-600 mb-3">{errorItem.municipioDestinoId.message}</p>
          )}
        </>
      ) : (
        <>
          <label className="block text-sm text-gray-600 mb-1">País de destino</label>
          <select
            {...register(`solicitudes.${index}.paisDestinoId`, {
              setValueAs: (v) => (v === '' ? undefined : Number(v)),
            })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 mb-1 focus:outline-none focus:ring-2 focus:ring-marca-medio"
            disabled={paisesCargando}
          >
            <option value="">{paisesCargando ? 'Cargando países...' : 'Selecciona un país'}</option>
            {paises.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          {errorItem?.paisDestinoId && (
            <p className="text-sm text-red-600 mb-3">{errorItem.paisDestinoId.message}</p>
          )}
        </>
      )}

      <label className="flex items-center gap-2 text-sm text-gray-700 mt-3 mb-2">
        <input type="checkbox" {...register(`solicitudes.${index}.estaDeclarado`)} />
        La mercancía ya está declarada en el municipio de origen
      </label>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          {...register(`solicitudes.${index}.esParaExportacion`)}
          disabled={tipoDestino === 'pais'}
        />
        Es para exportación
      </label>
    </div>
  )
}
