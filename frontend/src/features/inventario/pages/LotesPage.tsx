import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Sidebar } from '../../../shared/components/Sidebar'
import { inventarioSidebarItems } from '../sidebarItems'
import { getLotesDisponibles, crearLote, editarLote, cancelarLote } from '../api/inventarioApi'
import { LoteForm } from '../components/LoteForm'
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

function formatearFecha(fechaIso: string) {
  return new Date(fechaIso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function LotesPage() {
  const queryClient = useQueryClient()
  const lotesQuery = useQuery({ queryKey: ['lotes-disponibles'], queryFn: getLotesDisponibles })

  const [creando, setCreando] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [cancelandoId, setCancelandoId] = useState<number | null>(null)

  function invalidarListados() {
    queryClient.invalidateQueries({ queryKey: ['lotes-disponibles'] })
    queryClient.invalidateQueries({ queryKey: ['inventario'] })
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
      editarLote(loteId, {
        productos: data.productos.map((p) => ({ productoId: p.productoId!, cantidad: p.cantidad })),
      }),
    onSuccess: () => {
      invalidarListados()
      setEditandoId(null)
    },
  })

  const cancelarMutation = useMutation({
    mutationFn: cancelarLote,
    onMutate: (loteId) => setCancelandoId(loteId),
    onSettled: () => setCancelandoId(null),
    onSuccess: invalidarListados,
  })

  const mensajeError =
    (isAxiosError<{ mensaje?: string }>(crearMutation.error) && crearMutation.error.response?.data?.mensaje) ||
    (isAxiosError<{ mensaje?: string }>(editarMutation.error) && editarMutation.error.response?.data?.mensaje) ||
    (isAxiosError<{ mensaje?: string }>(cancelarMutation.error) && cancelarMutation.error.response?.data?.mensaje) ||
    null

  return (
    <div className="min-h-dvh flex bg-gray-50">
      <Sidebar items={inventarioSidebarItems} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 sm:p-10">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold text-marca-oscuro">Lotes</h1>
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
          <p className="text-sm text-gray-500 mb-6">
            Agrupa la mercancía que vas a movilizar. Cada lote solo puede usarse en una tornaguía.
          </p>

          {mensajeError && (
            <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {mensajeError}
            </p>
          )}

          {creando && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-bold text-marca-oscuro mb-3">Nuevo lote</p>
              <LoteForm
                textoBoton="Crear lote"
                guardando={crearMutation.isPending}
                onGuardar={(values) =>
                  crearMutation.mutate({
                    productos: values.productos.map((p) => ({ productoId: p.productoId!, cantidad: p.cantidad })),
                  })
                }
                onCancelar={() => setCreando(false)}
              />
            </div>
          )}

          {lotesQuery.isLoading && <p className="text-sm text-gray-400">Cargando lotes...</p>}
          {lotesQuery.data?.length === 0 && !creando && (
            <p className="text-sm text-gray-400">No tienes lotes disponibles todavía.</p>
          )}

          <div className="space-y-3">
            {lotesQuery.data?.map((lote) => (
              <div key={lote.loteId} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-marca-oscuro">{lote.numeroSerie}</p>
                    <p className="text-xs text-gray-400">Creado el {formatearFecha(lote.fechaCreacion)}</p>
                  </div>
                  {editandoId !== lote.loteId && (
                    <div className="flex gap-2">
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
                        {cancelandoId === lote.loteId ? 'Cancelando...' : 'Cancelar lote'}
                      </button>
                    </div>
                  )}
                </div>

                {editandoId === lote.loteId ? (
                  <LoteForm
                    valoresIniciales={loteAValoresFormulario(lote)}
                    textoBoton="Guardar cambios"
                    guardando={editarMutation.isPending}
                    onGuardar={(values) => editarMutation.mutate({ loteId: lote.loteId, data: values })}
                    onCancelar={() => setEditandoId(null)}
                  />
                ) : (
                  <ul className="text-sm text-gray-600 space-y-1">
                    {lote.productos.map((p) => (
                      <li key={p.productoId}>
                        {p.productoNombre}: <span className="font-semibold">{p.cantidad}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
