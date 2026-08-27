import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getLotesDisponibles, crearLote } from '../api/inventarioApi'
import { LoteForm } from './LoteForm'
import { productosParaRequest } from '../schemas'
import type { Lote } from '../types'
import { extraerMensajeAxios } from '../../../shared/lib/errores'

interface SelectorLoteProps {
  bodegaId: number | undefined
  loteId: number | undefined
  onCambiar: (loteId: number | undefined) => void
  errorLoteId?: string
}

export function SelectorLote({ bodegaId, loteId, onCambiar, errorLoteId }: SelectorLoteProps) {
  const queryClient = useQueryClient()
  const lotesQuery = useQuery({
    queryKey: ['lotes-disponibles', bodegaId],
    queryFn: () => getLotesDisponibles(bodegaId),
  })
  const [creando, setCreando] = useState(false)

  const crearLoteMutation = useMutation({
    mutationFn: crearLote,
    onSuccess: (lote) => {
      queryClient.invalidateQueries({ queryKey: ['lotes-disponibles', bodegaId] })
      queryClient.invalidateQueries({ queryKey: ['inventario', bodegaId] })
      seleccionarLote(lote)
      setCreando(false)
    },
  })

  function seleccionarLote(lote: Lote) {
    onCambiar(lote.loteId)
  }

  const mensajeErrorCrear = crearLoteMutation.error
    ? (extraerMensajeAxios(crearLoteMutation.error) ?? 'No se pudo crear el lote.')
    : null

  return (
    <div>
      <label className="block text-sm text-gray-600 mb-2">Lote a movilizar</label>

      {!creando && (
        <>
          {lotesQuery.isLoading && <p className="text-sm text-gray-400">Cargando lotes...</p>}

          {lotesQuery.data?.length === 0 && (
            <p className="text-sm text-gray-400 mb-2">No tienes lotes disponibles todavía.</p>
          )}

          <div className="space-y-2 mb-2">
            {lotesQuery.data?.map((lote) => (
              <label
                key={lote.loteId}
                className={`flex items-center justify-between gap-3 border rounded-lg px-3 py-2.5 cursor-pointer text-sm transition ${
                  loteId === lote.loteId ? 'border-marca-medio bg-marca-medio/5' : 'border-gray-200'
                }`}
              >
                <span>
                  <span className="font-semibold">{lote.numeroSerie}</span>{' '}
                  <span className="text-gray-500">
                    ({lote.productos.map((p) => `${p.productoNombre} x${p.cantidad}`).join(', ')})
                  </span>
                </span>
                <input
                  type="radio"
                  name="lote-seleccionado"
                  checked={loteId === lote.loteId}
                  onChange={() => seleccionarLote(lote)}
                />
              </label>
            ))}
          </div>

          {bodegaId != null ? (
            <button
              type="button"
              onClick={() => setCreando(true)}
              className="text-sm text-marca-medio font-semibold hover:underline"
            >
              + Crear lote nuevo
            </button>
          ) : (
            <p className="text-xs text-gray-400">
              Registra una bodega de origen para poder crear un lote nuevo.
            </p>
          )}
        </>
      )}

      {errorLoteId && <p className="text-xs text-red-600 mt-1">{errorLoteId}</p>}

      {creando && bodegaId != null && (
        <div className="border border-gray-200 rounded-lg p-3 mt-2">
          <p className="text-sm font-semibold text-marca-oscuro mb-2">Nuevo lote</p>
          <LoteForm
            bodegaId={bodegaId}
            textoBoton="Crear lote"
            guardando={crearLoteMutation.isPending}
            onGuardar={(values) =>
              crearLoteMutation.mutate({ bodegaId, productos: productosParaRequest(values) })
            }
            onCancelar={() => setCreando(false)}
          />
          {mensajeErrorCrear && <p className="text-xs text-red-600 mt-2">{mensajeErrorCrear}</p>}
        </div>
      )}
    </div>
  )
}
