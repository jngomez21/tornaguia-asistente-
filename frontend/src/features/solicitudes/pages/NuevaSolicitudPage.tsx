import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { getMunicipios, getPaises, crearSolicitud } from '../api/solicitudesApi'
import { nuevaSolicitudFormSchema, solicitudItemPorDefecto } from '../schemas'
import type { NuevaSolicitudFormValues, SolicitudItemFormValues } from '../schemas'
import { ResultadoSolicitud } from '../components/ResultadoSolicitud'
import { SolicitudFormItem } from '../components/SolicitudFormItem'
import { Sidebar } from '../../../shared/components/Sidebar'
import { sidebarIconos } from '../../../shared/components/sidebarIconos'
import type { CrearSolicitudResponse } from '../types'

const sidebarItems = [
  { key: 'nueva', label: 'Nueva solicitud', icon: sidebarIconos.nuevaSolicitud, to: '/solicitudes/nueva' },
  { key: 'historial', label: 'Historial de solicitudes', icon: sidebarIconos.historial, disabled: true },
]

type ResultadoItem = { label: string } & (
  | { ok: true; data: CrearSolicitudResponse }
  | { ok: false; mensaje: string }
)

export function NuevaSolicitudPage() {
  const municipiosQuery = useQuery({ queryKey: ['municipios'], queryFn: getMunicipios })
  const paisesQuery = useQuery({ queryKey: ['paises'], queryFn: getPaises })

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<NuevaSolicitudFormValues>({
    resolver: zodResolver(nuevaSolicitudFormSchema),
    defaultValues: { solicitudes: [solicitudItemPorDefecto] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'solicitudes' })
  const esMultiple = fields.length > 1

  function nombreMunicipio(id: number | undefined) {
    return municipiosQuery.data?.find((m) => m.id === id)?.nombre ?? '—'
  }

  function nombrePais(id: number | undefined) {
    return paisesQuery.data?.find((p) => p.id === id)?.nombre ?? '—'
  }

  function etiquetaSolicitud(item: SolicitudItemFormValues) {
    const origen = nombreMunicipio(item.municipioOrigenId)
    const destino =
      item.tipoDestino === 'municipio' ? nombreMunicipio(item.municipioDestinoId) : nombrePais(item.paisDestinoId)
    return `${origen} → ${destino}`
  }

  async function enviarSolicitudes(items: SolicitudItemFormValues[]): Promise<ResultadoItem[]> {
    const resultados = await Promise.allSettled(
      items.map((item) =>
        crearSolicitud({
          municipioOrigenId: item.municipioOrigenId!,
          municipioDestinoId: item.tipoDestino === 'municipio' ? item.municipioDestinoId : undefined,
          paisDestinoId: item.tipoDestino === 'pais' ? item.paisDestinoId : undefined,
          estaDeclarado: item.estaDeclarado,
          esParaExportacion: item.esParaExportacion,
        }),
      ),
    )

    return resultados.map((resultado, i) => {
      const label = etiquetaSolicitud(items[i])
      if (resultado.status === 'fulfilled') {
        return { label, ok: true, data: resultado.value }
      }
      const mensaje = isAxiosError<{ mensaje?: string }>(resultado.reason)
        ? (resultado.reason.response?.data?.mensaje ?? 'No se pudo procesar esta solicitud.')
        : 'No se pudo procesar esta solicitud.'
      return { label, ok: false, mensaje }
    })
  }

  const mutation = useMutation<ResultadoItem[], unknown, SolicitudItemFormValues[]>({
    mutationFn: enviarSolicitudes,
  })

  function onSubmit(values: NuevaSolicitudFormValues) {
    mutation.mutate(values.solicitudes)
  }

  function onNuevaConsulta() {
    mutation.reset()
    reset({ solicitudes: [solicitudItemPorDefecto] })
  }

  const resultados = mutation.data
  const esResultadoMultiple = (resultados?.length ?? 0) > 1

  return (
    <div className="min-h-dvh flex bg-gray-50">
      <Sidebar items={sidebarItems} />

      <main className="flex-1 overflow-y-auto">
        <div className={`${esResultadoMultiple ? 'max-w-5xl' : 'max-w-2xl'} mx-auto p-6 sm:p-10`}>
          {resultados ? (
            <>
              <h1 className="text-2xl font-bold text-marca-oscuro mb-1">
                {esResultadoMultiple ? 'Resultado de las consultas' : 'Resultado de la consulta'}
              </h1>
              <p className="text-sm text-gray-500 mb-8">
                {esResultadoMultiple
                  ? `Se procesaron ${resultados.length} tornaguías.`
                  : 'Este es el tipo de tornaguía que aplica.'}
              </p>

              <div className={esResultadoMultiple ? 'grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8' : 'mb-8'}>
                {resultados.map((resultado, i) => (
                  <div
                    key={i}
                    className={`h-full rounded-xl border shadow-sm p-6 ${
                      resultado.ok ? 'bg-white border-gray-200' : 'bg-red-50 border-red-200'
                    } ${esResultadoMultiple ? '' : 'max-w-md mx-auto'}`}
                  >
                    {resultado.ok ? (
                      <ResultadoSolicitud resultado={resultado.data} titulo={resultado.label} />
                    ) : (
                      <div className="h-full flex flex-col">
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-3 pb-3 border-b border-red-100">
                          {resultado.label}
                        </p>
                        <p className="text-sm text-red-700">{resultado.mensaje}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={onNuevaConsulta}
                className="w-full max-w-md mx-auto mt-2 block bg-marca-oscuro text-white font-semibold py-3 rounded-lg hover:opacity-90 transition"
              >
                Nueva consulta
              </button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-marca-oscuro mb-1">Nueva solicitud</h1>
              <p className="text-sm text-gray-500 mb-6">
                Indica el origen y el destino del transporte para determinar el tipo de tornaguía.
              </p>

              <label className="flex items-center gap-2 text-sm text-gray-700 mb-6">
                <input
                  type="checkbox"
                  checked={esMultiple}
                  onChange={(e) => {
                    if (!e.target.checked && fields.length > 1) {
                      for (let i = fields.length - 1; i > 0; i--) remove(i)
                    } else if (e.target.checked) {
                      append({ ...solicitudItemPorDefecto })
                    }
                  }}
                />
                Realizar más de 1 tornaguía
              </label>

              <form onSubmit={handleSubmit(onSubmit)}>
                {fields.map((field, index) => (
                  <SolicitudFormItem
                    key={field.id}
                    index={index}
                    control={control}
                    register={register}
                    setValue={setValue}
                    errors={errors.solicitudes}
                    municipios={municipiosQuery.data ?? []}
                    municipiosCargando={municipiosQuery.isLoading}
                    paises={paisesQuery.data ?? []}
                    paisesCargando={paisesQuery.isLoading}
                    mostrarQuitar={esMultiple && fields.length > 1}
                    onQuitar={() => remove(index)}
                    titulo={fields.length > 1 ? `Tornaguía ${index + 1}` : ''}
                  />
                ))}

                {esMultiple && (
                  <button
                    type="button"
                    onClick={() => append({ ...solicitudItemPorDefecto })}
                    className="w-full border border-dashed border-marca-medio text-marca-medio text-sm font-semibold py-2.5 rounded-lg hover:bg-marca-medio/5 transition mb-6"
                  >
                    + Agregar otra tornaguía
                  </button>
                )}

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full bg-marca-oscuro text-white font-semibold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                >
                  {mutation.isPending
                    ? 'Consultando...'
                    : esMultiple
                      ? `Consultar ${fields.length} tornaguías`
                      : 'Consultar tipo de tornaguía'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
