import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { getMunicipios, getPaises, crearSolicitud, guardarDetalleTornaguia, guardarPdfTornaguia } from '../api/solicitudesApi'
import { nuevaSolicitudFormSchema, solicitudItemPorDefecto } from '../schemas'
import type { NuevaSolicitudFormValues, SolicitudItemFormValues, DetalleTornaguiaFormValues } from '../schemas'
import { ResultadoSolicitud } from '../components/ResultadoSolicitud'
import type { EstadoTornaguiaPdf } from '../components/ResultadoSolicitud'
import { MapaRutasTornaguias } from '../components/MapaRutasTornaguias'
import { SolicitudFormItem } from '../components/SolicitudFormItem'
import { ModalDetalleTornaguia } from '../components/ModalDetalleTornaguia'
import { construirPdfTornaguia, descargarPdf, bytesABase64 } from '../lib/generarPdfTornaguia'
import { mapearDetalleARequest } from '../lib/mapearDetalle'
import { Sidebar } from '../../../shared/components/Sidebar'
import { solicitudesSidebarItems } from '../sidebarItems'
import type { CrearSolicitudResponse } from '../types'

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

  const resultados = mutation.data
  const esResultadoMultiple = (resultados?.length ?? 0) > 1

  const [carrito, setCarrito] = useState<Record<number, DetalleTornaguiaFormValues>>({})
  const [generados, setGenerados] = useState<Record<number, boolean>>({})
  const [pdfsGenerados, setPdfsGenerados] = useState<Record<number, Uint8Array>>({})
  const [solicitudModalAbierta, setSolicitudModalAbierta] = useState<number | null>(null)
  const [errorGeneracion, setErrorGeneracion] = useState<string | null>(null)

  function onNuevaConsulta() {
    mutation.reset()
    reset({ solicitudes: [solicitudItemPorDefecto] })
    setCarrito({})
    setGenerados({})
    setPdfsGenerados({})
    setSolicitudModalAbierta(null)
    setErrorGeneracion(null)
  }

  function descargarPdfSolicitud(solicitudId: number) {
    const bytes = pdfsGenerados[solicitudId]
    if (!bytes) return
    descargarPdf(bytes, `tornaguia-${solicitudId}.pdf`)
  }

  function estadoPdfDe(solicitudId: number): EstadoTornaguiaPdf {
    if (generados[solicitudId]) return 'generado'
    if (carrito[solicitudId]) return 'en_carrito'
    return 'pendiente'
  }

  function resultadoOkPorId(solicitudId: number) {
    const item = resultados?.find((r) => r.ok && r.data.solicitudId === solicitudId)
    return item?.ok ? item : undefined
  }

  const guardarDetalleMutation = useMutation({
    mutationFn: ({ solicitudId, values }: { solicitudId: number; values: DetalleTornaguiaFormValues }) =>
      guardarDetalleTornaguia(solicitudId, mapearDetalleARequest(values)),
  })

  function abrirModal(solicitudId: number) {
    setErrorGeneracion(null)
    setSolicitudModalAbierta(solicitudId)
  }

  function cerrarModal() {
    setSolicitudModalAbierta(null)
  }

  async function subirPdf(solicitudId: number, bytes: Uint8Array) {
    try {
      await guardarPdfTornaguia(solicitudId, bytesABase64(bytes))
    } catch {
      // El PDF ya quedó disponible para descarga en esta sesión; queda pendiente sincronizarlo con el historial.
    }
  }

  async function onConfirmarModal(values: DetalleTornaguiaFormValues) {
    const solicitudId = solicitudModalAbierta
    if (solicitudId == null) return

    if (!esResultadoMultiple) {
      const resultadoItem = resultadoOkPorId(solicitudId)
      if (!resultadoItem) return

      try {
        const detalle = await guardarDetalleMutation.mutateAsync({ solicitudId, values })
        const bytes = await construirPdfTornaguia(resultadoItem.data, detalle, resultadoItem.label)
        await subirPdf(solicitudId, bytes)
        setPdfsGenerados((prev) => ({ ...prev, [solicitudId]: bytes }))
        setGenerados((prev) => ({ ...prev, [solicitudId]: true }))
        cerrarModal()
      } catch (error) {
        setErrorGeneracion(
          isAxiosError<{ mensaje?: string }>(error)
            ? (error.response?.data?.mensaje ?? 'No se pudo guardar el detalle de la tornaguía.')
            : 'No se pudo guardar el detalle de la tornaguía.',
        )
      }
      return
    }

    setCarrito((prev) => ({ ...prev, [solicitudId]: values }))
    cerrarModal()
  }

  const generarLoteMutation = useMutation({
    mutationFn: async () => {
      const entradas = Object.entries(carrito).map(([id, values]) => [Number(id), values] as const)

      const resultadosLote = await Promise.allSettled(
        entradas.map(async ([solicitudId, values]) => {
          const detalle = await guardarDetalleMutation.mutateAsync({ solicitudId, values })
          const resultadoItem = resultadoOkPorId(solicitudId)
          const bytes = resultadoItem
            ? await construirPdfTornaguia(resultadoItem.data, detalle, resultadoItem.label)
            : null
          if (bytes) await subirPdf(solicitudId, bytes)
          return { solicitudId, bytes }
        }),
      )

      const exitosos: { solicitudId: number; bytes: Uint8Array | null }[] = []
      const fallidos: number[] = []
      resultadosLote.forEach((r, i) => {
        const [solicitudId] = entradas[i]
        if (r.status === 'fulfilled') exitosos.push(r.value)
        else fallidos.push(solicitudId)
      })

      return { exitosos, fallidos }
    },
    onSuccess: ({ exitosos, fallidos }) => {
      setGenerados((prev) => {
        const siguiente = { ...prev }
        exitosos.forEach(({ solicitudId }) => {
          siguiente[solicitudId] = true
        })
        return siguiente
      })
      setPdfsGenerados((prev) => {
        const siguiente = { ...prev }
        exitosos.forEach(({ solicitudId, bytes }) => {
          if (bytes) siguiente[solicitudId] = bytes
        })
        return siguiente
      })
      setCarrito((prev) => {
        const siguiente = { ...prev }
        exitosos.forEach(({ solicitudId }) => {
          delete siguiente[solicitudId]
        })
        return siguiente
      })
      setErrorGeneracion(
        fallidos.length > 0
          ? `No se pudieron generar ${fallidos.length} de las tornaguías seleccionadas. Vuelve a intentarlo.`
          : null,
      )
    },
  })

  const solicitudesEnCarrito = Object.keys(carrito).length

  return (
    <div className="min-h-dvh flex bg-gray-50">
      <Sidebar items={solicitudesSidebarItems} />

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

              {esResultadoMultiple && (
                <MapaRutasTornaguias
                  rutas={resultados.flatMap((r) =>
                    r.ok && r.data.geometria && r.data.geometria.length > 1
                      ? [
                          {
                            solicitudId: r.data.solicitudId,
                            geometria: r.data.geometria,
                            tipoTornaguia: r.data.tipoTornaguia,
                            estadoPdf: estadoPdfDe(r.data.solicitudId),
                            onDescargarPdf: () => descargarPdfSolicitud(r.data.solicitudId),
                          },
                        ]
                      : [],
                  )}
                />
              )}

              <div className={esResultadoMultiple ? 'grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8' : 'mb-8'}>
                {resultados.map((resultado, i) => (
                  <div
                    key={i}
                    className={`h-full rounded-xl border shadow-sm p-6 ${
                      resultado.ok ? 'bg-white border-gray-200' : 'bg-red-50 border-red-200'
                    } ${esResultadoMultiple ? '' : 'max-w-md mx-auto'}`}
                  >
                    {resultado.ok ? (
                      <ResultadoSolicitud
                        resultado={resultado.data}
                        titulo={resultado.label}
                        estadoPdf={estadoPdfDe(resultado.data.solicitudId)}
                        onSolicitarTornaguia={() => abrirModal(resultado.data.solicitudId)}
                        onDescargarPdf={() => descargarPdfSolicitud(resultado.data.solicitudId)}
                        mostrarMapa={!esResultadoMultiple}
                      />
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

              {errorGeneracion && (
                <p className="w-full max-w-md mx-auto mb-4 text-sm text-red-600 text-center">{errorGeneracion}</p>
              )}

              {esResultadoMultiple && solicitudesEnCarrito > 0 && (
                <div className="w-full max-w-md mx-auto mb-4 flex items-center justify-between gap-3 border border-marca-medio/30 bg-marca-medio/5 rounded-lg px-4 py-3">
                  <p className="text-sm text-marca-oscuro">
                    {solicitudesEnCarrito} tornaguía{solicitudesEnCarrito > 1 ? 's' : ''} lista
                    {solicitudesEnCarrito > 1 ? 's' : ''} para generar
                  </p>
                  <button
                    type="button"
                    onClick={() => generarLoteMutation.mutate()}
                    disabled={generarLoteMutation.isPending}
                    className="shrink-0 bg-marca-oscuro text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                  >
                    {generarLoteMutation.isPending
                      ? 'Generando...'
                      : `Generar ${solicitudesEnCarrito} tornaguía${solicitudesEnCarrito > 1 ? 's' : ''}`}
                  </button>
                </div>
              )}

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

      {solicitudModalAbierta != null && (
        <ModalDetalleTornaguia
          titulo={resultadoOkPorId(solicitudModalAbierta)?.label ?? ''}
          valoresIniciales={carrito[solicitudModalAbierta]}
          textoBotonPrincipal={esResultadoMultiple ? 'Agregar al PDF' : 'Generar tornaguía'}
          enviando={!esResultadoMultiple && guardarDetalleMutation.isPending}
          onCerrar={cerrarModal}
          onConfirmar={onConfirmarModal}
        />
      )}
    </div>
  )
}
