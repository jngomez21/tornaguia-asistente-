import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { getMunicipios, getPaises, crearSolicitud } from '../api/solicitudesApi'
import { nuevaSolicitudSchema } from '../schemas'
import type { NuevaSolicitudFormValues } from '../schemas'
import { ResultadoSolicitud } from '../components/ResultadoSolicitud'
import type { CrearSolicitudRequest, CrearSolicitudResponse } from '../types'

export function NuevaSolicitudPage() {
  const municipiosQuery = useQuery({ queryKey: ['municipios'], queryFn: getMunicipios })
  const paisesQuery = useQuery({ queryKey: ['paises'], queryFn: getPaises })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<NuevaSolicitudFormValues>({
    resolver: zodResolver(nuevaSolicitudSchema),
    defaultValues: {
      tipoDestino: 'municipio',
      estaDeclarado: false,
      esParaExportacion: false,
    },
  })

  const tipoDestino = watch('tipoDestino')
  const municipioOrigenId = watch('municipioOrigenId')

  useEffect(() => {
    if (tipoDestino === 'pais') {
      setValue('esParaExportacion', true)
      setValue('municipioDestinoId', undefined)
    } else {
      setValue('paisDestinoId', undefined)
    }
  }, [tipoDestino, setValue])

  const mutation = useMutation<CrearSolicitudResponse, unknown, CrearSolicitudRequest>({
    mutationFn: crearSolicitud,
  })

  function onSubmit(values: NuevaSolicitudFormValues) {
    mutation.mutate({
      municipioOrigenId: values.municipioOrigenId!,
      municipioDestinoId: values.tipoDestino === 'municipio' ? values.municipioDestinoId : undefined,
      paisDestinoId: values.tipoDestino === 'pais' ? values.paisDestinoId : undefined,
      estaDeclarado: values.estaDeclarado,
      esParaExportacion: values.esParaExportacion,
    })
  }

  const mensajeError = isAxiosError<{ mensaje?: string }>(mutation.error)
    ? mutation.error.response?.data?.mensaje
    : undefined

  if (mutation.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6 sm:p-8">
        <ResultadoSolicitud
          resultado={mutation.data}
          onNuevaSolicitud={() => {
            mutation.reset()
            reset()
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6 sm:p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-marca-oscuro mb-1">Nueva solicitud</h1>
        <p className="text-sm text-gray-500 mb-8">
          Indica el origen y el destino del transporte para determinar el tipo de tornaguía.
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <label className="block text-sm text-gray-600 mb-1">Municipio de origen</label>
          <select
            {...register('municipioOrigenId', {
              setValueAs: (v) => (v === '' ? undefined : Number(v)),
            })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 mb-1 focus:outline-none focus:ring-2 focus:ring-marca-medio"
            disabled={municipiosQuery.isLoading}
          >
            <option value="">
              {municipiosQuery.isLoading ? 'Cargando municipios...' : 'Selecciona un municipio'}
            </option>
            {municipiosQuery.data?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} — {m.departamentoNombre}
              </option>
            ))}
          </select>
          {errors.municipioOrigenId && (
            <p className="text-sm text-red-600 mb-3">{errors.municipioOrigenId.message}</p>
          )}

          <label className="block text-sm text-gray-600 mb-1 mt-3">Tipo de destino</label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" value="municipio" {...register('tipoDestino')} />
              Municipio en Colombia
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" value="pais" {...register('tipoDestino')} />
              País (exportación terrestre)
            </label>
          </div>

          {tipoDestino === 'municipio' ? (
            <>
              <label className="block text-sm text-gray-600 mb-1">Municipio de destino</label>
              <select
                {...register('municipioDestinoId', {
                  setValueAs: (v) => (v === '' ? undefined : Number(v)),
                })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 mb-1 focus:outline-none focus:ring-2 focus:ring-marca-medio"
                disabled={municipiosQuery.isLoading}
              >
                <option value="">
                  {municipiosQuery.isLoading ? 'Cargando municipios...' : 'Selecciona un municipio'}
                </option>
                {municipiosQuery.data
                  ?.filter((m) => m.id !== municipioOrigenId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} — {m.departamentoNombre}
                    </option>
                  ))}
              </select>
              {errors.municipioDestinoId && (
                <p className="text-sm text-red-600 mb-3">{errors.municipioDestinoId.message}</p>
              )}
            </>
          ) : (
            <>
              <label className="block text-sm text-gray-600 mb-1">País de destino</label>
              <select
                {...register('paisDestinoId', {
                  setValueAs: (v) => (v === '' ? undefined : Number(v)),
                })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 mb-1 focus:outline-none focus:ring-2 focus:ring-marca-medio"
                disabled={paisesQuery.isLoading}
              >
                <option value="">
                  {paisesQuery.isLoading ? 'Cargando países...' : 'Selecciona un país'}
                </option>
                {paisesQuery.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
              {errors.paisDestinoId && (
                <p className="text-sm text-red-600 mb-3">{errors.paisDestinoId.message}</p>
              )}
            </>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-700 mt-3 mb-2">
            <input type="checkbox" {...register('estaDeclarado')} />
            La mercancía ya está declarada en el municipio de origen
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700 mb-6">
            <input type="checkbox" {...register('esParaExportacion')} disabled={tipoDestino === 'pais'} />
            Es para exportación
          </label>

          {mensajeError && <p className="text-sm text-red-600 mb-4">{mensajeError}</p>}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-marca-oscuro text-white font-semibold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {mutation.isPending ? 'Consultando...' : 'Consultar tipo de tornaguía'}
          </button>
        </form>
      </div>
    </div>
  )
}
