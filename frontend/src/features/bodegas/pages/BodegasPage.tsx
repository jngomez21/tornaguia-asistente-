import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Sidebar } from '../../../shared/components/Sidebar'
import { appSidebarItems } from '../../../shared/components/sidebarItems'
import { extraerMensajeAxios } from '../../../shared/lib/errores'
import { getBodegas, crearBodega, editarBodega, eliminarBodega } from '../api/bodegasApi'
import { BodegaForm } from '../components/BodegaForm'
import { MapaBodegas } from '../components/MapaBodegas'
import { DetalleBodegaPanel } from '../components/DetalleBodegaPanel'
import type { BodegaFormValues } from '../schemas'
import type { Bodega } from '../types'

function bodegaAValoresFormulario(bodega: Bodega): BodegaFormValues {
  return {
    nombre: bodega.nombre,
    municipioId: bodega.municipioId,
    direccion:
      bodega.direccionEspecifica && bodega.latitud != null && bodega.longitud != null
        ? { texto: bodega.direccionEspecifica, latitud: bodega.latitud, longitud: bodega.longitud }
        : null,
  }
}

function valoresFormularioARequest(values: BodegaFormValues) {
  return {
    nombre: values.nombre,
    municipioId: values.municipioId!,
    direccionEspecifica: values.direccion?.texto ?? null,
    direccionLatitud: values.direccion?.latitud ?? null,
    direccionLongitud: values.direccion?.longitud ?? null,
  }
}

function IconoEditar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path
        d="M12.5 5.5l6 6L8 22H2v-6L12.5 5.5Z M15.5 2.5l6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconoEliminar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function BodegasPage() {
  const queryClient = useQueryClient()
  const bodegasQuery = useQuery({ queryKey: ['bodegas'], queryFn: getBodegas })

  const [searchParams] = useSearchParams()

  const [creando, setCreando] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)
  const [bodegaSeleccionadaId, setBodegaSeleccionadaId] = useState<number | null>(() => {
    const idDesdeUrl = Number(searchParams.get('bodegaId'))
    return idDesdeUrl > 0 ? idDesdeUrl : null
  })

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
      editarBodega(bodegaId, valoresFormularioARequest(data)),
    onSuccess: () => {
      invalidarListado()
      setEditandoId(null)
    },
  })

  const eliminarMutation = useMutation({
    mutationFn: eliminarBodega,
    onMutate: (bodegaId: number) => setEliminandoId(bodegaId),
    onSettled: () => setEliminandoId(null),
    onSuccess: (_data, bodegaId) => {
      invalidarListado()
      setBodegaSeleccionadaId((actual) => (actual === bodegaId ? null : actual))
    },
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

  function alternarSeleccion(id: number) {
    setBodegaSeleccionadaId((actual) => (actual === id ? null : id))
  }

  const bodegaSeleccionada = bodegasQuery.data?.find((b) => b.id === bodegaSeleccionadaId) ?? null

  return (
    <div className="min-h-dvh flex bg-gray-50">
      <Sidebar items={appSidebarItems} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 sm:p-10">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-marca-oscuro mb-1">Bodegas</h1>
              <p className="text-sm text-gray-500">
                Registra tus bodegas para relacionar tu mercancía con el lugar donde está.
              </p>
            </div>
            {!creando && (
              <button
                type="button"
                onClick={() => setCreando(true)}
                className="shrink-0 bg-marca-oscuro text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition"
              >
                + Crear bodega
              </button>
            )}
          </div>

          {mensajeError && (
            <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {mensajeError}
            </p>
          )}

          {creando && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-bold text-marca-oscuro mb-3">Nueva bodega</p>
              <BodegaForm
                textoBoton="Crear bodega"
                guardando={crearMutation.isPending}
                onGuardar={(values) => crearMutation.mutate(valoresFormularioARequest(values))}
                onCancelar={() => setCreando(false)}
              />
            </div>
          )}

          <div className={bodegaSeleccionada ? 'grid grid-cols-1 lg:grid-cols-3 gap-6 items-start' : ''}>
            <div className={bodegaSeleccionada ? 'lg:col-span-2 min-w-0' : ''}>
              <MapaBodegas
                bodegas={bodegasQuery.data ?? []}
                bodegaSeleccionadaId={bodegaSeleccionadaId}
                onSeleccionar={alternarSeleccion}
              />

              {bodegasQuery.isLoading && <p className="text-sm text-gray-400">Cargando bodegas...</p>}
              {bodegasQuery.data?.length === 0 && !creando && (
                <p className="text-sm text-gray-400">No tienes bodegas registradas todavía.</p>
              )}

              <div
                className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${bodegaSeleccionada ? '' : 'lg:grid-cols-3'}`}
              >
                {bodegasQuery.data?.map((bodega) => {
                  const seleccionada = bodega.id === bodegaSeleccionadaId
                  return (
                    <div
                      key={bodega.id}
                      onClick={() => editandoId !== bodega.id && alternarSeleccion(bodega.id)}
                      className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer ${
                        seleccionada ? 'ring-2 ring-marca-oscuro border-transparent' : 'border-gray-200'
                      }`}
                    >
                      {editandoId === bodega.id ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <p className="text-sm font-bold text-marca-oscuro mb-3">Editar bodega</p>
                          <BodegaForm
                            valoresIniciales={bodegaAValoresFormulario(bodega)}
                            textoBoton="Guardar cambios"
                            guardando={editarMutation.isPending}
                            onGuardar={(values) => editarMutation.mutate({ bodegaId: bodega.id, data: values })}
                            onCancelar={() => setEditandoId(null)}
                          />
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-10 h-10 shrink-0 rounded-lg bg-marca-medio/10 flex items-center justify-center text-lg">
                              📦
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-marca-oscuro leading-tight truncate">
                                {bodega.nombre}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {bodega.municipioNombre} — {bodega.departamentoNombre}
                              </p>
                              <p className="text-xs text-gray-400 mt-1.5">
                                {bodega.lotesActivos} lote{bodega.lotesActivos === 1 ? '' : 's'} ·{' '}
                                {bodega.productosDistintos} producto{bodega.productosDistintos === 1 ? '' : 's'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setEditandoId(bodega.id)}
                              aria-label="Editar bodega"
                              title="Editar"
                              className="text-gray-400 hover:text-marca-medio transition p-1"
                            >
                              <IconoEditar />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEliminar(bodega)}
                              disabled={eliminandoId === bodega.id}
                              aria-label="Eliminar bodega"
                              title="Eliminar"
                              className="text-gray-400 hover:text-red-500 transition p-1 disabled:opacity-50"
                            >
                              <IconoEliminar />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {bodegaSeleccionada && (
              <DetalleBodegaPanel bodega={bodegaSeleccionada} onCerrar={() => setBodegaSeleccionadaId(null)} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
