import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { getLotesDisponibles, crearLote } from '../api/inventarioApi'
import { LoteForm } from './LoteForm'
import type { Lote } from '../types'

interface CapacidadPorProducto {
  productoId: number
  capacidad: number
}

interface SelectorLoteProps {
  loteId: number | undefined
  capacidades: CapacidadPorProducto[]
  onCambiar: (loteId: number | undefined, capacidades: CapacidadPorProducto[]) => void
  errorLoteId?: string
  hayErroresCapacidad?: boolean
}

export function SelectorLote({
  loteId,
  capacidades,
  onCambiar,
  errorLoteId,
  hayErroresCapacidad,
}: SelectorLoteProps) {
  const queryClient = useQueryClient()
  const lotesQuery = useQuery({ queryKey: ['lotes-disponibles'], queryFn: getLotesDisponibles })
  const [creando, setCreando] = useState(false)

  const crearLoteMutation = useMutation({
    mutationFn: crearLote,
    onSuccess: (lote) => {
      queryClient.invalidateQueries({ queryKey: ['lotes-disponibles'] })
      queryClient.invalidateQueries({ queryKey: ['inventario'] })
      seleccionarLote(lote)
      setCreando(false)
    },
  })

  function seleccionarLote(lote: Lote) {
    onCambiar(
      lote.loteId,
      lote.productos.map((p) => ({ productoId: p.productoId, capacidad: NaN })),
    )
  }

  function actualizarCapacidad(productoId: number, capacidad: number) {
    onCambiar(
      loteId,
      capacidades.map((c) => (c.productoId === productoId ? { ...c, capacidad } : c)),
    )
  }

  const loteSeleccionado = lotesQuery.data?.find((l) => l.loteId === loteId)

  const mensajeErrorCrear = isAxiosError<{ mensaje?: string }>(crearLoteMutation.error)
    ? crearLoteMutation.error.response?.data?.mensaje
    : crearLoteMutation.error
      ? 'No se pudo crear el lote.'
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

          <button
            type="button"
            onClick={() => setCreando(true)}
            className="text-sm text-marca-medio font-semibold hover:underline"
          >
            + Crear lote nuevo
          </button>
        </>
      )}

      {errorLoteId && <p className="text-xs text-red-600 mt-1">{errorLoteId}</p>}

      {creando && (
        <div className="border border-gray-200 rounded-lg p-3 mt-2">
          <p className="text-sm font-semibold text-marca-oscuro mb-2">Nuevo lote</p>
          <LoteForm
            textoBoton="Crear lote"
            guardando={crearLoteMutation.isPending}
            onGuardar={(values) =>
              crearLoteMutation.mutate({
                productos: values.productos.map((p) => ({ productoId: p.productoId!, cantidad: p.cantidad })),
              })
            }
            onCancelar={() => setCreando(false)}
          />
          {mensajeErrorCrear && <p className="text-xs text-red-600 mt-2">{mensajeErrorCrear}</p>}
        </div>
      )}

      {loteSeleccionado && !creando && (
        <div className="border border-gray-200 rounded-lg p-3 mt-3">
          <p className="text-xs text-gray-500 mb-2">Capacidad del vehículo por producto</p>
          {loteSeleccionado.productos.map((p) => {
            const capacidadActual = capacidades.find((c) => c.productoId === p.productoId)?.capacidad
            return (
              <div key={p.productoId} className="grid grid-cols-2 gap-3 items-center mb-2">
                <span className="text-sm">
                  {p.productoNombre} (cant. {p.cantidad})
                </span>
                <input
                  type="number"
                  step="any"
                  value={Number.isFinite(capacidadActual) ? capacidadActual : ''}
                  onChange={(e) => actualizarCapacidad(p.productoId, e.target.valueAsNumber)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marca-medio"
                />
              </div>
            )
          })}
          {hayErroresCapacidad && (
            <p className="text-xs text-red-600 mt-1">Todas las capacidades deben ser mayores a 0.</p>
          )}
        </div>
      )}
    </div>
  )
}
