import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Sidebar } from '../../../shared/components/Sidebar'
import { appSidebarItems } from '../../../shared/components/sidebarItems'
import { extraerMensajeAxios } from '../../../shared/lib/errores'
import { getBodegas, crearBodega, editarBodega, eliminarBodega } from '../api/bodegasApi'
import { BodegaForm } from '../components/BodegaForm'
import { MapaBodegas } from '../components/MapaBodegas'
import type { BodegaFormValues } from '../schemas'
import type { Bodega } from '../types'

function bodegaAValoresFormulario(bodega: Bodega): BodegaFormValues {
  return { nombre: bodega.nombre, municipioId: bodega.municipioId }
}

export function BodegasPage() {
  const queryClient = useQueryClient()
  const bodegasQuery = useQuery({ queryKey: ['bodegas'], queryFn: getBodegas })

  const [creando, setCreando] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)

  function invalidarListado() {
    queryClient.invalidateQueries({ queryKey: ['bodegas'] })
  }

  const crearMutation = useMutation({
    mutationFn: crearBodega,
    onSuccess: () => {
      invalidarListado()
      setCreando(false)
    },
  })

  const editarMutation = useMutation({
    mutationFn: ({ bodegaId, data }: { bodegaId: number; data: BodegaFormValues }) =>
      editarBodega(bodegaId, { nombre: data.nombre, municipioId: data.municipioId! }),
    onSuccess: () => {
      invalidarListado()
      setEditandoId(null)
    },
  })

  const eliminarMutation = useMutation({
    mutationFn: eliminarBodega,
    onMutate: (bodegaId: number) => setEliminandoId(bodegaId),
    onSettled: () => setEliminandoId(null),
    onSuccess: invalidarListado,
  })

  const mensajeError =
    extraerMensajeAxios(crearMutation.error) ??
    extraerMensajeAxios(editarMutation.error) ??
    extraerMensajeAxios(eliminarMutation.error) ??
    null

  function onEliminar(bodega: Bodega) {
    const confirmado = window.confirm(
      `¿Eliminar la bodega "${bodega.nombre}"? Si tiene tornaguías históricas, se conservarán sin la bodega asociada.`,
    )
    if (confirmado) eliminarMutation.mutate(bodega.id)
  }

  return (
    <div className="min-h-dvh flex bg-gray-50">
      <Sidebar items={appSidebarItems} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 sm:p-10">
          <div className="max-w-2xl mx-auto text-center mb-6">
            <h1 className="text-2xl font-bold text-marca-oscuro mb-1">Bodegas</h1>
            <p className="text-sm text-gray-500">
              Registra tus bodegas para relacionar tu mercancía con el lugar donde está.
            </p>
          </div>

          <MapaBodegas bodegas={bodegasQuery.data ?? []} />

          {mensajeError && (
            <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
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
                + Crear bodega
              </button>
            )}
          </div>

          {creando && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-bold text-marca-oscuro mb-3">Nueva bodega</p>
              <BodegaForm
                textoBoton="Crear bodega"
                guardando={crearMutation.isPending}
                onGuardar={(values) =>
                  crearMutation.mutate({ nombre: values.nombre, municipioId: values.municipioId! })
                }
                onCancelar={() => setCreando(false)}
              />
            </div>
          )}

          {bodegasQuery.isLoading && <p className="text-sm text-gray-400">Cargando bodegas...</p>}
          {bodegasQuery.data?.length === 0 && !creando && (
            <p className="text-sm text-gray-400">No tienes bodegas registradas todavía.</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bodegasQuery.data?.map((bodega) => (
              <div
                key={bodega.id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition"
              >
                {editandoId === bodega.id ? (
                  <>
                    <p className="text-sm font-bold text-marca-oscuro mb-3">Editar bodega</p>
                    <BodegaForm
                      valoresIniciales={bodegaAValoresFormulario(bodega)}
                      textoBoton="Guardar cambios"
                      guardando={editarMutation.isPending}
                      onGuardar={(values) => editarMutation.mutate({ bodegaId: bodega.id, data: values })}
                      onCancelar={() => setEditandoId(null)}
                    />
                  </>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-lg bg-marca-medio/10 flex items-center justify-center text-lg">
                        📦
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-marca-oscuro leading-tight truncate">{bodega.nombre}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {bodega.municipioNombre} — {bodega.departamentoNombre}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditandoId(bodega.id)}
                        className="text-xs font-semibold text-marca-medio hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onEliminar(bodega)}
                        disabled={eliminandoId === bodega.id}
                        className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-50"
                      >
                        {eliminandoId === bodega.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
