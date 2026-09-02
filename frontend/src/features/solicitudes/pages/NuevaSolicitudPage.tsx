import { useEffect, useRef, useState } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  getMunicipios,
  getPaises,
  crearSolicitud,
  guardarDetalleTornaguia,
  guardarPdfTornaguia,
  calcularRuta,
  getHistorialSolicitudes,
} from '../api/solicitudesApi'
import { nuevaSolicitudFormSchema, solicitudItemPorDefecto } from '../schemas'
import type { NuevaSolicitudFormValues, SolicitudItemFormValues, DetalleTornaguiaFormValues } from '../schemas'
import { ResultadoSolicitud } from '../components/ResultadoSolicitud'
import type { EstadoTornaguiaPdf } from '../components/ResultadoSolicitud'
import { MapaRutasTornaguias } from '../components/MapaRutasTornaguias'
import { SolicitudFormItem } from '../components/SolicitudFormItem'
import {
  BotonExplicacionTipoTornaguia,
  PanelExplicacionTipoTornaguia,
} from '../components/ExplicacionTipoTornaguia'
import { ModalDetalleTornaguia } from '../components/ModalDetalleTornaguia'
import { construirPdfTornaguia, descargarPdf, bytesABase64 } from '../lib/generarPdfTornaguia'
import type { DatosRutaTornaguia } from '../lib/generarPdfTornaguia'
import { mapearDetalleARequest } from '../lib/mapearDetalle'
import { colorPorTipo } from '../lib/coloresTornaguia'
import { Sidebar } from '../../../shared/components/Sidebar'
import { appSidebarItems } from '../../../shared/components/sidebarItems'
import { extraerMensajeAxios } from '../../../shared/lib/errores'
import { getBodegas } from '../../bodegas/api/bodegasApi'
import type { CrearSolicitudResponse, HistorialSolicitud } from '../types'

type ResultadoItem = {
  label: string
  tipoDestino: 'municipio' | 'pais'
  esParaExportacion: boolean
  municipioOrigenId: number
  municipioDestinoId: number | undefined
  paisDestinoId: number | undefined
  bodegaOrigenId: number | undefined
  bodegaDestinoId: number | undefined
} & ({ ok: true; data: CrearSolicitudResponse } | { ok: false; mensaje: string })

export function NuevaSolicitudPage() {
  const municipiosQuery = useQuery({ queryKey: ['municipios'], queryFn: getMunicipios })
  const paisesQuery = useQuery({ queryKey: ['paises'], queryFn: getPaises })
  const bodegasQuery = useQuery({ queryKey: ['bodegas'], queryFn: getBodegas })

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

  const [tornaguiaActivaIndex, setTornaguiaActivaIndex] = useState(0)
  const indiceActivo = Math.min(tornaguiaActivaIndex, fields.length - 1)

  const primerItem = useWatch({ control, name: 'solicitudes.0' })

  const rutaPreviewHabilitada =
    !esMultiple &&
    primerItem?.tipoDestino === 'municipio' &&
    primerItem?.municipioOrigenId != null &&
    primerItem?.municipioDestinoId != null &&
    primerItem.municipioOrigenId !== primerItem.municipioDestinoId

  const rutaPreviewQuery = useQuery({
    queryKey: ['ruta-preview', primerItem?.municipioOrigenId, primerItem?.municipioDestinoId],
    queryFn: () => calcularRuta(primerItem!.municipioOrigenId!, primerItem!.municipioDestinoId!),
    enabled: rutaPreviewHabilitada,
    staleTime: 5 * 60 * 1000,
  })

  // El centrado vertical de la página se desactiva permanentemente en cuanto se elige
  // una ruta (aunque luego se borre): así el bloque nunca cambia de "centrado" a
  // "arriba" de golpe justo cuando el mapa crece al cargar (lo que se veía como un salto).
  const [huboSeleccionDeRuta, setHuboSeleccionDeRuta] = useState(false)
  if (rutaPreviewHabilitada && !huboSeleccionDeRuta) {
    setHuboSeleccionDeRuta(true)
  }

  const historialQuery = useQuery({ queryKey: ['historial-solicitudes'], queryFn: getHistorialSolicitudes })
  const historialOrdenado = [...(historialQuery.data ?? [])].sort(
    (a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime(),
  )
  // "Generar un nuevo envío" siempre crea una solicitud nueva reutilizando origen/destino
  // de una solicitud pasada (tenga o no PDF generado); por eso se muestran las más
  // recientes sin importar su estado.
  const recientes = historialOrdenado.slice(0, 5)
  const recientesLote = historialOrdenado.slice(0, 3)

  function aplicarEnvioReciente(item: HistorialSolicitud) {
    const origenId = municipiosQuery.data?.find((m) => m.nombre === item.municipioOrigenNombre)?.id
    if (origenId == null) return
    const index = indiceActivo
    setValue(`solicitudes.${index}.municipioOrigenId`, origenId)

    if (item.municipioDestinoNombre) {
      const destinoId = municipiosQuery.data?.find((m) => m.nombre === item.municipioDestinoNombre)?.id
      setValue(`solicitudes.${index}.tipoDestino`, 'municipio')
      setValue(`solicitudes.${index}.municipioDestinoId`, destinoId)
    } else if (item.paisDestinoNombre) {
      const paisId = paisesQuery.data?.find((p) => p.nombre === item.paisDestinoNombre)?.id
      setValue(`solicitudes.${index}.tipoDestino`, 'pais')
      setValue(`solicitudes.${index}.paisDestinoId`, paisId)
    }

    setValue(`solicitudes.${index}.estaDeclarado`, item.estaDeclarado)
    setValue(`solicitudes.${index}.esParaExportacion`, item.esParaExportacion)
  }

  function nombreMunicipio(id: number | undefined) {
    return municipiosQuery.data?.find((m) => m.id === id)?.nombre ?? '—'
  }

  function nombrePais(id: number | undefined) {
    return paisesQuery.data?.find((p) => p.id === id)?.nombre ?? '—'
  }

  // Coordenadas exactas de la bodega (si tiene dirección específica geocodificada) para mostrar
  // el marcador de inicio/fin en el punto real, sin afectar el cálculo de la ruta ni la decisión.
  function coordsDeBodega(bodegaId: number | undefined): [number, number] | undefined {
    const bodega = bodegasQuery.data?.find((b) => b.id === bodegaId)
    if (!bodega || bodega.latitud == null || bodega.longitud == null) return undefined
    return [bodega.longitud, bodega.latitud]
  }

  function etiquetaSolicitud(item: SolicitudItemFormValues) {
    const origen = nombreMunicipio(item.municipioOrigenId)
    const destino =
      item.tipoDestino === 'municipio' ? nombreMunicipio(item.municipioDestinoId) : nombrePais(item.paisDestinoId)
    return `${origen} → ${destino}`
  }

  function construirRutaInfo(item: ResultadoItem & { ok: true }): DatosRutaTornaguia {
    const origen = municipiosQuery.data?.find((m) => m.id === item.municipioOrigenId)
    const destinoMunicipio =
      item.tipoDestino === 'municipio'
        ? municipiosQuery.data?.find((m) => m.id === item.municipioDestinoId)
        : undefined
    const destinoPais = item.tipoDestino === 'pais' ? paisesQuery.data?.find((p) => p.id === item.paisDestinoId) : undefined

    return {
      origenDepartamento: origen?.departamentoNombre ?? '—',
      origenMunicipio: origen?.nombre ?? '—',
      origenDireccion: item.data.origenDireccionEspecifica,
      destinoDepartamento: destinoMunicipio?.departamentoNombre ?? null,
      destinoMunicipio: destinoMunicipio?.nombre ?? destinoPais?.nombre ?? '—',
      departamentosIntermedios: item.data.departamentosIntermedios ?? [],
    }
  }

  async function enviarSolicitudes(items: SolicitudItemFormValues[]): Promise<ResultadoItem[]> {
    const resultados = await Promise.allSettled(
      items.map((item) =>
        crearSolicitud({
          // municipioOrigenId/municipioDestinoId también quedan poblados cuando el origen/destino
          // se eligió desde una bodega (para la vista previa de ruta); el backend trata
          // bodega.../municipio... como alternativas excluyentes, así que solo se envía el
          // municipio cuando NO viene de una bodega.
          municipioOrigenId: item.bodegaOrigenId == null ? item.municipioOrigenId : undefined,
          municipioDestinoId:
            item.tipoDestino === 'municipio' && item.bodegaDestinoId == null ? item.municipioDestinoId : undefined,
          paisDestinoId: item.tipoDestino === 'pais' ? item.paisDestinoId : undefined,
          bodegaOrigenId: item.bodegaOrigenId,
          bodegaDestinoId: item.tipoDestino === 'municipio' ? item.bodegaDestinoId : undefined,
          estaDeclarado: item.estaDeclarado,
          esParaExportacion: item.esParaExportacion,
        }),
      ),
    )

    return resultados.map((resultado, i) => {
      const label = etiquetaSolicitud(items[i])
      const {
        tipoDestino,
        esParaExportacion,
        municipioOrigenId,
        municipioDestinoId,
        paisDestinoId,
        bodegaOrigenId,
        bodegaDestinoId,
      } = items[i]
      const base = {
        label,
        tipoDestino,
        esParaExportacion,
        municipioOrigenId: municipioOrigenId!,
        municipioDestinoId,
        paisDestinoId,
        bodegaOrigenId,
        bodegaDestinoId,
      }
      if (resultado.status === 'fulfilled') {
        return { ...base, ok: true, data: resultado.value }
      }
      const mensaje = extraerMensajeAxios(resultado.reason) ?? 'No se pudo procesar esta solicitud.'
      return { ...base, ok: false, mensaje }
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
  const [solicitudEnFoco, setSolicitudEnFoco] = useState<number | null>(null)
  const [seleccionadoIndex, setSeleccionadoIndex] = useState(0)
  const [explicacionAbierta, setExplicacionAbierta] = useState(false)

  const formCardRef = useRef<HTMLDivElement>(null)
  const [formCardHeight, setFormCardHeight] = useState<number>()
  const mapaRef = useRef<HTMLDivElement>(null)
  const [mapaHeight, setMapaHeight] = useState<number>()
  const formYBotonRef = useRef<HTMLFormElement>(null)
  const [formYBotonHeight, setFormYBotonHeight] = useState<number>()
  const panelExplicacionRef = useRef<HTMLDivElement>(null)
  const [panelExplicacionHeight, setPanelExplicacionHeight] = useState<number>()

  useEffect(() => {
    const el = formCardRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setFormCardHeight(el.getBoundingClientRect().height))
    observer.observe(el)
    return () => observer.disconnect()
  }, [esMultiple])

  useEffect(() => {
    const el = mapaRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setMapaHeight(el.getBoundingClientRect().height))
    observer.observe(el)
    return () => observer.disconnect()
  }, [esMultiple])

  useEffect(() => {
    const el = formYBotonRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setFormYBotonHeight(el.getBoundingClientRect().height))
    observer.observe(el)
    return () => observer.disconnect()
  }, [esMultiple])

  useEffect(() => {
    const el = panelExplicacionRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setPanelExplicacionHeight(el.getBoundingClientRect().height))
    observer.observe(el)
    return () => observer.disconnect()
  }, [esMultiple])

  const MT_MAPA_PX = 24 // mt-6, separación entre el botón "Consultar" y el mapa
  const mapaTopOffset = (formYBotonHeight ?? 0) + MT_MAPA_PX
  const repetirMarginTop = explicacionAbierta ? Math.max(mapaTopOffset - (panelExplicacionHeight ?? 0), 0) : 0

  const repetirCardHeight = explicacionAbierta ? mapaHeight : formCardHeight

  const resultadoMostrado = resultados
    ? resultados[esResultadoMultiple ? Math.min(seleccionadoIndex, resultados.length - 1) : 0]
    : undefined

  function seleccionarResultado(index: number) {
    setSeleccionadoIndex(index)
    const r = resultados?.[index]
    if (r?.ok) setSolicitudEnFoco(r.data.solicitudId)
  }

  function onNuevaConsulta() {
    mutation.reset()
    reset({ solicitudes: [solicitudItemPorDefecto] })
    setCarrito({})
    setGenerados({})
    setPdfsGenerados({})
    setSolicitudModalAbierta(null)
    setErrorGeneracion(null)
    setSolicitudEnFoco(null)
    setSeleccionadoIndex(0)
    setTornaguiaActivaIndex(0)
    setHuboSeleccionDeRuta(false)
  }

  function descargarPdfSolicitud(solicitudId: number) {
    const bytes = pdfsGenerados[solicitudId]
    if (!bytes) return
    descargarPdf(bytes, `tornaguia-${solicitudId}.pdf`)
  }

  function descargarTodasLasGeneradas() {
    Object.entries(pdfsGenerados).forEach(([solicitudId, bytes]) => {
      descargarPdf(bytes, `tornaguia-${solicitudId}.pdf`)
    })
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
        const bytes = await construirPdfTornaguia(resultadoItem.data, detalle, construirRutaInfo(resultadoItem))
        await subirPdf(solicitudId, bytes)
        setPdfsGenerados((prev) => ({ ...prev, [solicitudId]: bytes }))
        setGenerados((prev) => ({ ...prev, [solicitudId]: true }))
        cerrarModal()
      } catch (error) {
        setErrorGeneracion(extraerMensajeAxios(error) ?? 'No se pudo guardar el detalle de la tornaguía.')
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
            ? await construirPdfTornaguia(resultadoItem.data, detalle, construirRutaInfo(resultadoItem))
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
  const solicitudesGeneradas = Object.keys(generados).length

  return (
    <div className="h-dvh flex bg-gray-50">
      <Sidebar items={appSidebarItems} />

      <main
        className={`flex-1 overflow-y-auto flex flex-col ${
          huboSeleccionDeRuta ? 'justify-start' : '[justify-content:safe_center]'
        }`}
      >
        <div
          className={`${
            resultados ? (esResultadoMultiple ? 'max-w-5xl' : 'max-w-2xl') : esMultiple ? 'max-w-6xl' : 'max-w-5xl'
          } w-full mx-auto p-6 sm:p-10`}
        >
          {resultados ? (
            <>
              <h1 className="text-2xl font-bold text-marca-oscuro mb-1 text-center">
                {esResultadoMultiple ? 'Resultado de las consultas' : 'Resultado de la consulta'}
              </h1>
              <p className="text-sm text-gray-500 mb-8 text-center">
                {esResultadoMultiple
                  ? `Se procesaron ${resultados.length} tornaguías.`
                  : 'Este es el tipo de tornaguía que aplica.'}
              </p>

              {esResultadoMultiple && (
                <MapaRutasTornaguias
                  rutaEnFocoId={solicitudEnFoco}
                  onSalirFoco={() => setSolicitudEnFoco(null)}
                  rutas={resultados.flatMap((r) =>
                    r.ok && r.data.geometria && r.data.geometria.length > 1
                      ? [
                          {
                            solicitudId: r.data.solicitudId,
                            geometria: r.data.geometria,
                            tipoTornaguia: r.data.tipoTornaguia,
                            justificacion: r.data.justificacion,
                            estadoPdf: estadoPdfDe(r.data.solicitudId),
                            tipoDestino: r.tipoDestino,
                            esParaExportacion: r.esParaExportacion,
                            departamentosIntermedioIds: r.data.departamentosIntermedioIds ?? undefined,
                            origenExacto: coordsDeBodega(r.bodegaOrigenId),
                            destinoExacto: coordsDeBodega(r.bodegaDestinoId),
                            onSolicitarTornaguia: () => abrirModal(r.data.solicitudId),
                            onDescargarPdf: () => descargarPdfSolicitud(r.data.solicitudId),
                          },
                        ]
                      : [],
                  )}
                />
              )}

              {esResultadoMultiple ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8 items-start">
                  <div className="lg:col-span-1 flex flex-col gap-2">
                    {resultados.map((resultado, i) => {
                      const activo = i === seleccionadoIndex
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => seleccionarResultado(i)}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium text-left transition ${
                            activo
                              ? 'border-marca-oscuro bg-marca-oscuro text-white'
                              : resultado.ok
                                ? 'border-gray-200 bg-white text-gray-700 hover:border-marca-medio/40 hover:bg-marca-medio/5'
                                : 'border-red-200 bg-red-50 text-red-700 hover:border-red-300'
                          }`}
                        >
                          <span className="truncate">{resultado.label}</span>
                          {resultado.ok ? (
                            <span
                              className={`shrink-0 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${
                                activo
                                  ? 'bg-white/25'
                                  : colorPorTipo[resultado.data.tipoTornaguia] ?? 'bg-marca-oscuro'
                              }`}
                            >
                              {resultado.data.tipoTornaguia}
                            </span>
                          ) : (
                            <span
                              className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                activo ? 'bg-white/25 text-white' : 'bg-red-100 text-red-700'
                              }`}
                            >
                              Error
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {resultadoMostrado && (
                    <div
                      className={`lg:col-span-3 rounded-xl border shadow-sm p-6 ${
                        resultadoMostrado.ok ? 'bg-white border-gray-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      {resultadoMostrado.ok ? (
                        <ResultadoSolicitud
                          resultado={resultadoMostrado.data}
                          titulo={resultadoMostrado.label}
                          estadoPdf={estadoPdfDe(resultadoMostrado.data.solicitudId)}
                          onSolicitarTornaguia={() => abrirModal(resultadoMostrado.data.solicitudId)}
                          onDescargarPdf={() => descargarPdfSolicitud(resultadoMostrado.data.solicitudId)}
                          mostrarMapa={false}
                          tipoDestino={resultadoMostrado.tipoDestino}
                          esParaExportacion={resultadoMostrado.esParaExportacion}
                        />
                      ) : (
                        <div className="h-full flex flex-col">
                          <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-3 pb-3 border-b border-red-100">
                            {resultadoMostrado.label}
                          </p>
                          <p className="text-sm text-red-700">{resultadoMostrado.mensaje}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                resultadoMostrado && (
                  <div
                    className={`max-w-md mx-auto rounded-xl border shadow-sm p-6 mb-8 ${
                      resultadoMostrado.ok ? 'bg-white border-gray-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    {resultadoMostrado.ok ? (
                      <ResultadoSolicitud
                        resultado={resultadoMostrado.data}
                        titulo={resultadoMostrado.label}
                        estadoPdf={estadoPdfDe(resultadoMostrado.data.solicitudId)}
                        onSolicitarTornaguia={() => abrirModal(resultadoMostrado.data.solicitudId)}
                        onDescargarPdf={() => descargarPdfSolicitud(resultadoMostrado.data.solicitudId)}
                        mostrarMapa
                        tipoDestino={resultadoMostrado.tipoDestino}
                        esParaExportacion={resultadoMostrado.esParaExportacion}
                      />
                    ) : (
                      <div className="h-full flex flex-col">
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-3 pb-3 border-b border-red-100">
                          {resultadoMostrado.label}
                        </p>
                        <p className="text-sm text-red-700">{resultadoMostrado.mensaje}</p>
                      </div>
                    )}
                  </div>
                )
              )}

              {esResultadoMultiple ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-1">
                    {solicitudesEnCarrito > 0 ? (
                      <button
                        type="button"
                        onClick={() => generarLoteMutation.mutate()}
                        disabled={generarLoteMutation.isPending}
                        className="w-full bg-marca-oscuro text-white text-sm font-semibold px-4 py-4 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                      >
                        {generarLoteMutation.isPending
                          ? 'Generando...'
                          : `Generar ${solicitudesEnCarrito} tornaguía${solicitudesEnCarrito > 1 ? 's' : ''}`}
                      </button>
                    ) : (
                      solicitudesGeneradas > 0 && (
                        <button
                          type="button"
                          onClick={descargarTodasLasGeneradas}
                          className="w-full bg-marca-verde text-white text-sm font-semibold px-4 py-4 rounded-lg hover:opacity-90 transition"
                        >
                          {`Descargar ${solicitudesGeneradas} tornaguía${solicitudesGeneradas > 1 ? 's' : ''}`}
                        </button>
                      )
                    )}
                  </div>

                  <div className="lg:col-span-3">
                    {errorGeneracion && (
                      <p className="w-full max-w-md mx-auto mb-4 text-sm text-red-600 text-center">
                        {errorGeneracion}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={onNuevaConsulta}
                      className="w-full block bg-marca-oscuro text-white font-semibold text-base py-4 rounded-lg hover:opacity-90 transition"
                    >
                      Nueva consulta
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {errorGeneracion && (
                    <p className="w-full max-w-md mx-auto mb-4 text-sm text-red-600 text-center">{errorGeneracion}</p>
                  )}

                  <button
                    type="button"
                    onClick={onNuevaConsulta}
                    className="w-full max-w-md mx-auto mt-2 block bg-marca-oscuro text-white font-semibold text-base py-4 rounded-lg hover:opacity-90 transition"
                  >
                    Nueva consulta
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <div className="animate-fade-slide-up mb-5 text-center">
                <h1 className="text-2xl font-bold text-marca-oscuro mb-1">Nueva solicitud</h1>
                <p className="text-sm text-gray-500">
                  Indica el origen y el destino del transporte para determinar el tipo de tornaguía.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-5 items-center">
                <div className="lg:col-span-3">
                  <div className="inline-flex shrink-0 rounded-lg border border-gray-200 p-1 bg-white">
                    <button
                      type="button"
                      onClick={() => {
                        if (esMultiple) for (let i = fields.length - 1; i > 0; i--) remove(i)
                      }}
                      className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${
                        !esMultiple ? 'bg-marca-oscuro text-white' : 'text-gray-500 hover:text-marca-oscuro'
                      }`}
                    >
                      Tornaguía
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!esMultiple) append({ ...solicitudItemPorDefecto })
                      }}
                      className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${
                        esMultiple ? 'bg-marca-oscuro text-white' : 'text-gray-500 hover:text-marca-oscuro'
                      }`}
                    >
                      Tornaguías
                    </button>
                  </div>
                </div>

                {!esMultiple && (
                  <div className="lg:col-span-2">
                    <BotonExplicacionTipoTornaguia
                      abierto={explicacionAbierta}
                      onClick={() => setExplicacionAbierta((v) => !v)}
                      compacto
                    />
                  </div>
                )}
              </div>

              {esMultiple ? (
                <>
                  {recientesLote.length > 0 && (
                    <div
                      style={{ animationDelay: '140ms' }}
                      className="animate-fade-slide-up flex flex-wrap items-center justify-end gap-4 mb-5"
                    >
                      <div className="w-full sm:w-auto flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">
                          Generar nuevo envío en Tornaguía {indiceActivo + 1}:
                        </span>
                        {recientesLote.map((item) => (
                          <button
                            key={item.solicitudId}
                            type="button"
                            onClick={() => aplicarEnvioReciente(item)}
                            className="flex items-center gap-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-full pl-3 pr-2 py-1.5 hover:border-marca-medio/40 hover:bg-marca-medio/5 transition"
                          >
                            <span className="truncate max-w-[160px]">
                              {item.municipioOrigenNombre} → {item.municipioDestinoNombre ?? item.paisDestinoNombre}
                            </span>
                            <span
                              className={`shrink-0 inline-block ${
                                colorPorTipo[item.tipoTornaguia] ?? 'bg-marca-oscuro'
                              } text-white text-[10px] font-semibold px-2 py-0.5 rounded-full`}
                            >
                              {item.tipoTornaguia}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div
                      style={{ animationDelay: '200ms' }}
                      className="animate-fade-slide-up grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6"
                    >
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
                          bodegas={bodegasQuery.data ?? []}
                          bodegasCargando={bodegasQuery.isLoading}
                          mostrarQuitar={fields.length > 1}
                          onQuitar={() => remove(index)}
                          titulo={`Tornaguía ${index + 1}`}
                          activa={index === indiceActivo}
                          onActivar={() => setTornaguiaActivaIndex(index)}
                        />
                      ))}

                      <button
                        type="button"
                        onClick={() => append({ ...solicitudItemPorDefecto })}
                        className="min-h-[220px] border-2 border-dashed border-marca-medio/50 text-marca-medio rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-marca-medio/5 hover:border-marca-medio transition"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
                          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                        </svg>
                        <span className="text-sm font-semibold">Agregar otra tornaguía</span>
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="w-full bg-marca-oscuro text-white font-semibold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                    >
                      {mutation.isPending ? 'Consultando...' : `Consultar ${fields.length} tornaguías`}
                    </button>
                  </form>
                </>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                  <div style={{ animationDelay: '140ms' }} className="animate-fade-slide-up lg:col-span-3">
                    <form ref={formYBotonRef} onSubmit={handleSubmit(onSubmit)}>
                      <div className="mb-4" ref={formCardRef}>
                        <SolicitudFormItem
                          index={0}
                          control={control}
                          register={register}
                          setValue={setValue}
                          errors={errors.solicitudes}
                          municipios={municipiosQuery.data ?? []}
                          municipiosCargando={municipiosQuery.isLoading}
                          paises={paisesQuery.data ?? []}
                          paisesCargando={paisesQuery.isLoading}
                          bodegas={bodegasQuery.data ?? []}
                          bodegasCargando={bodegasQuery.isLoading}
                          mostrarQuitar={false}
                          onQuitar={() => remove(0)}
                          titulo=""
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="w-full bg-marca-oscuro text-white font-semibold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                      >
                        {mutation.isPending ? 'Consultando...' : 'Consultar tipo de tornaguía'}
                      </button>
                    </form>

                    <div className="mt-6">
                      <div ref={mapaRef}>
                        {rutaPreviewQuery.data && rutaPreviewQuery.data.geometria.length > 1 ? (
                          <MapaRutasTornaguias
                            animar
                            rutas={[
                              {
                                solicitudId: 0,
                                geometria: rutaPreviewQuery.data.geometria,
                                tipoTornaguia: 'Ruta',
                                justificacion: 'Vista previa de la ruta.',
                                estadoPdf: 'pendiente',
                                interactiva: false,
                                departamentosIntermedioIds: rutaPreviewQuery.data.departamentosIntermedioIds,
                                origenExacto: coordsDeBodega(primerItem?.bodegaOrigenId),
                                destinoExacto: coordsDeBodega(primerItem?.bodegaDestinoId),
                              },
                            ]}
                          />
                        ) : rutaPreviewQuery.isLoading ? (
                          <div className="w-full h-80 rounded-xl bg-gray-100 animate-pulse" />
                        ) : (
                          <div className="w-full h-80 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col items-center justify-center text-center px-6">
                            <div className="w-14 h-14 rounded-full bg-marca-medio/10 flex items-center justify-center text-marca-medio mb-4">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.6}
                                className="w-7 h-7"
                              >
                                <circle cx="6" cy="7" r="2" />
                                <circle cx="18" cy="17" r="2" />
                                <path d="M7.5 8.5l9 7" strokeDasharray="2 3" strokeLinecap="round" />
                              </svg>
                            </div>
                            <p className="text-sm font-semibold text-marca-oscuro mb-1">La ruta aparecerá aquí</p>
                            <p className="text-xs text-gray-500 max-w-[220px]">
                              Elige el origen y el destino para ver el trayecto en el mapa.
                            </p>
                          </div>
                        )}
                      </div>

                      {rutaPreviewQuery.data && rutaPreviewQuery.data.geometria.length > 1 && (
                        <p className="text-xs text-gray-400">
                          {rutaPreviewQuery.data.distanciaKm.toFixed(0)} km · ~
                          {Math.round(rutaPreviewQuery.data.tiempoEstimadoMinutos / 60)} h estimadas
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    style={{ animationDelay: '200ms' }}
                    className="animate-fade-slide-up lg:col-span-2 lg:sticky lg:top-10 flex flex-col"
                  >
                    <PanelExplicacionTipoTornaguia abierto={explicacionAbierta} contenidoRef={panelExplicacionRef} />

                    {recientes.length > 0 && (
                      <div
                        style={{
                          marginTop: repetirMarginTop,
                          ...(repetirCardHeight ? { height: repetirCardHeight } : {}),
                        }}
                        className="flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm p-4 overflow-y-auto transition-all duration-300 ease-out"
                      >
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Generar un nuevo envío
                        </p>
                        <div className="flex-1 flex flex-col justify-center gap-2">
                          {recientes.map((item) => (
                            <button
                              key={item.solicitudId}
                              type="button"
                              onClick={() => aplicarEnvioReciente(item)}
                              className="flex items-center justify-between gap-2 text-left px-3 py-2 rounded-lg border border-gray-100 hover:border-marca-medio/40 hover:bg-marca-medio/5 transition"
                            >
                              <span className="text-sm text-gray-700 truncate">
                                {item.municipioOrigenNombre} →{' '}
                                {item.municipioDestinoNombre ?? item.paisDestinoNombre}
                              </span>
                              <span
                                className={`shrink-0 inline-block ${
                                  colorPorTipo[item.tipoTornaguia] ?? 'bg-marca-oscuro'
                                } text-white text-[10px] font-semibold px-2 py-0.5 rounded-full`}
                              >
                                {item.tipoTornaguia}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {solicitudModalAbierta != null && (
        <ModalDetalleTornaguia
          titulo={resultadoOkPorId(solicitudModalAbierta)?.label ?? ''}
          bodegaOrigenId={resultadoOkPorId(solicitudModalAbierta)?.bodegaOrigenId}
          tipoTornaguia={resultadoOkPorId(solicitudModalAbierta)?.data.tipoTornaguia}
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
