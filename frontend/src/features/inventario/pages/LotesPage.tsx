import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Sidebar } from '../../../shared/components/Sidebar'
import { appSidebarItems } from '../../../shared/components/sidebarItems'
import { formatearFecha } from '../../../shared/lib/formato'
import { extraerMensajeAxios } from '../../../shared/lib/errores'
import { getBodegas } from '../../bodegas/api/bodegasApi'
import { getLotesDisponibles, crearLote, editarLote, cancelarLote } from '../api/inventarioApi'
import { LoteForm } from '../components/LoteForm'
import { EntradaForm } from '../components/EntradaForm'
import { DisponibleTabla } from '../components/DisponibleTabla'
import { productosParaRequest } from '../schemas'
import type { LoteFormValues } from '../schemas'
import type { Lote } from '../types'

function loteAValoresFormulario(lote: Lote): LoteFormValues {
  return {
    productos: lote.productos.map((p) => ({
      productoId: p.productoId,
      productoNombre: p.productoNombre,
      cantidad: p.cantidad,
    })),
  }
}

export function LotesPage() {
  const queryClient = useQueryClient()
  const bodegasQuery = useQuery({ queryKey: ['bodegas'], queryFn: getBodegas })

  const [bodegaSeleccionadaId, setBodegaSeleccionadaId] = useState<number | null>(null)
  const bodegaActivaId = bodegaSeleccionadaId ?? bodegasQuery.data?.[0]?.id ?? null

  const lotesQuery = useQuery({
    queryKey: ['lotes-disponibles', bodegaActivaId],
    queryFn: () => getLotesDisponibles(bodegaActivaId!),
    enabled: bodegaActivaId != null,
  })

  const [creando, setCreando] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [cancelandoId, setCancelandoId] = useState<number | null>(null)

  function invalidarListados() {
    queryClient.invalidateQueries({ queryKey: ['lotes-disponibles', bodegaActivaId] })
    queryClient.invalidateQueries({ queryKey: ['inventario', bodegaActivaId] })
  }

  const crearMutation = useMutation({
    mutationFn: crearLote,
    onSuccess: () => {
      invalidarListados()
      setCreando(false)
    },
  })

  const editarMutation = useMutation({
    mutationFn: ({ loteId, data }: { loteId: number; data: LoteFormValues }) =>
      editarLote(loteId, { productos: productosParaRequest(data) }),
    onSuccess: () => {
      invalidarListados()
      setEditandoId(null)
    },
  })

  const cancelarMutation = useMutation({
    mutationFn: cancelarLote,
    onMutate: (loteId: number) => setCancelandoId(loteId),
    onSettled: () => setCancelandoId(null),
    onSuccess: invalidarListados,
  })

  const mensajeError =
    extraerMensajeAxios(crearMutation.error) ??
    extraerMensajeAxios(editarMutation.error) ??
    extraerMensajeAxios(cancelarMutation.error) ??
    null

  return (
    <div className="min-h-dvh flex bg-gray-50">
      <Sidebar items={appSidebarItems} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 sm:p-10">
          <div className="max-w-2xl mx-auto text-center mb-6">
            <h1 className="text-2xl font-bold text-marca-oscuro mb-1">Lotes</h1>
            <p className="text-sm text-gray-500">
              Agrupa la mercancía que vas a movilizar. Cada lote solo puede usarse en una tornaguía.
            </p>
          </div>

          {bodegasQuery.isLoading && <p className="text-sm text-gray-400 text-center">Cargando bodegas...</p>}

          {!bodegasQuery.isLoading && bodegasQuery.data?.length === 0 && (
            <div className="max-w-md mx-auto text-center bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-sm text-gray-600 mb-3">
                Necesitas registrar al menos una bodega antes de manejar inventario y lotes.
              </p>
              <Link
                to="/bodegas"
                className="inline-block bg-marca-oscuro text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition"
              >
                Crear una bodega
              </Link>
            </div>
          )}

          {bodegasQuery.data && bodegasQuery.data.length > 0 && (
            <>
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {bodegasQuery.data.map((bodega) => (
                  <button
                    key={bodega.id}
                    type="button"
                    onClick={() => setBodegaSeleccionadaId(bodega.id)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
                      bodegaActivaId === bodega.id
                        ? 'bg-marca-oscuro text-white border-marca-oscuro'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-marca-medio/40'
                    }`}
                  >
                    {bodega.nombre}
                  </button>
                ))}
              </div>

              {bodegaActivaId != null && (
                <>
                  <div className="max-w-2xl mx-auto">
                    <EntradaForm bodegaId={bodegaActivaId} />
                    <DisponibleTabla bodegaId={bodegaActivaId} />
                  </div>

                  <hr className="border-gray-200 my-6" />

                  {mensajeError && (
                    <p className="max-w-2xl mx-auto text-sm text-red-600 mb-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      {mensajeError}
                    </p>
                  )}

                  <div className="flex justify-end mb-4">
                    {!creando && (
                      <button
                        type="button"
                        onClick={() => setCreando(true)}
                        className="bg-marca-oscuro text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition"
                      >
                        + Crear lote
                      </button>
                    )}
                  </div>

                  {creando && (
                    <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl p-4 mb-6">
                      <p className="text-sm font-bold text-marca-oscuro mb-3">Nuevo lote</p>
                      <LoteForm
                        bodegaId={bodegaActivaId}
                        textoBoton="Crear lote"
                        guardando={crearMutation.isPending}
                        onGuardar={(values) =>
                          crearMutation.mutate({ bodegaId: bodegaActivaId, productos: productosParaRequest(values) })
                        }
                        onCancelar={() => setCreando(false)}
                      />
                    </div>
                  )}

                  {lotesQuery.isLoading && <p className="text-sm text-gray-400">Cargando lotes...</p>}
                  {lotesQuery.data?.length === 0 && !creando && (
                    <p className="text-sm text-gray-400">No tienes lotes disponibles todavía en esta bodega.</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lotesQuery.data?.map((lote) => (
                      <div
                        key={lote.loteId}
                        className="h-full flex flex-col bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 shrink-0 rounded-lg bg-marca-medio/10 flex items-center justify-center text-marca-medio">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.8}
                                className="w-5 h-5"
                              >
                                <path d="M3 7l9-4 9 4-9 4-9-4Z" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M3 7v10l9 4 9-4V7M12 11v10" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-marca-oscuro leading-tight truncate">
                                {lote.numeroSerie}
                              </p>
                              <p className="text-xs text-gray-400">{formatearFecha(lote.fechaCreacion)}</p>
                            </div>
                          </div>
                          {editandoId !== lote.loteId && (
                            <div className="flex gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setEditandoId(lote.loteId)}
                                className="text-xs font-semibold text-marca-medio hover:underline"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => cancelarMutation.mutate(lote.loteId)}
                                disabled={cancelandoId === lote.loteId}
                                className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-50"
                              >
                                {cancelandoId === lote.loteId ? 'Cancelando...' : 'Cancelar'}
                              </button>
                            </div>
                          )}
                        </div>

                        {editandoId === lote.loteId ? (
                          <LoteForm
                            bodegaId={bodegaActivaId}
                            valoresIniciales={loteAValoresFormulario(lote)}
                            textoBoton="Guardar cambios"
                            guardando={editarMutation.isPending}
                            onGuardar={(values) => editarMutation.mutate({ loteId: lote.loteId, data: values })}
                            onCancelar={() => setEditandoId(null)}
                          />
                        ) : (
                          <div className="flex-1 pt-3 border-t border-gray-100 space-y-2">
                            {lote.productos.map((p) => (
                              <div key={p.productoId} className="flex items-center justify-between gap-2 text-sm">
                                <span className="text-gray-600 truncate">{p.productoNombre}</span>
                                <span className="shrink-0 font-semibold text-marca-oscuro bg-gray-50 px-2 py-0.5 rounded-md text-xs">
                                  {p.cantidad}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
