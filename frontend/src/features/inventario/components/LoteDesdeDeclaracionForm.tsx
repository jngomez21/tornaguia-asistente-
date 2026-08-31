import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { proponerDeclaracion, crearLoteDesdeDeclaracion } from '../api/inventarioApi'
import { getDepartamentos } from '../../solicitudes/api/solicitudesApi'
import { bytesABase64 } from '../../solicitudes/lib/generarPdfTornaguia'
import {
  declaracionFormSchema,
  declaracionProductoPorDefecto,
  propuestaAValoresFormulario,
  productosDeclaradosParaRequest,
} from '../schemas'
import type { DeclaracionFormValues } from '../schemas'
import type { Lote } from '../types'
import { extraerMensajeAxios } from '../../../shared/lib/errores'

interface LoteDesdeDeclaracionFormProps {
  bodegaId: number
  onGuardado: (lote: Lote) => void
  onCancelar: () => void
}

export function LoteDesdeDeclaracionForm({ bodegaId, onGuardado, onCancelar }: LoteDesdeDeclaracionFormProps) {
  const departamentosQuery = useQuery({ queryKey: ['departamentos'], queryFn: getDepartamentos })

  const [documento, setDocumento] = useState<{
    bytes: string
    nombreArchivo: string
    contentType: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<DeclaracionFormValues>({
    resolver: zodResolver(declaracionFormSchema),
    defaultValues: { productos: [declaracionProductoPorDefecto] } as DeclaracionFormValues,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'productos' })

  const proponerMutation = useMutation({
    mutationFn: proponerDeclaracion,
    onSuccess: (propuesta) => reset(propuestaAValoresFormulario(propuesta)),
  })

  const crearMutation = useMutation({
    mutationFn: crearLoteDesdeDeclaracion,
    onSuccess: onGuardado,
  })

  async function onArchivoSeleccionado(archivo: File) {
    const buffer = await archivo.arrayBuffer()
    const bytes = bytesABase64(new Uint8Array(buffer))
    setDocumento({ bytes, nombreArchivo: archivo.name, contentType: archivo.type })
    proponerMutation.mutate({ documentoBytes: bytes, documentoContentType: archivo.type })
  }

  function onConfirmar(values: DeclaracionFormValues) {
    if (!documento) return
    crearMutation.mutate({
      bodegaId,
      numeroDeclaracion: values.numeroDeclaracion,
      departamentoId: values.departamentoId!,
      periodo: values.periodo,
      remitenteNombre: values.remitenteNombre,
      remitenteIdentificacion: values.remitenteIdentificacion,
      documentoBytes: documento.bytes,
      documentoNombreArchivo: documento.nombreArchivo,
      documentoContentType: documento.contentType,
      productos: productosDeclaradosParaRequest(values),
    })
  }

  const mensajeError =
    extraerMensajeAxios(proponerMutation.error) ?? extraerMensajeAxios(crearMutation.error) ?? null

  return (
    <div>
      {!documento && (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-600 mb-3">
            Sube la declaración departamental (PDF o foto) y la IA propondrá los datos del lote.
          </p>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => {
              const archivo = e.target.files?.[0]
              if (archivo) void onArchivoSeleccionado(archivo)
            }}
            className="text-sm"
          />
        </div>
      )}

      {proponerMutation.isPending && (
        <p className="text-sm text-gray-400 text-center mt-4">Leyendo el documento...</p>
      )}

      {mensajeError && (
        <p className="text-sm text-red-600 mt-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {mensajeError}
        </p>
      )}

      {documento && !proponerMutation.isPending && (
        <div className="mt-4">
          <p className="text-xs text-gray-400 mb-3">
            Revisa los datos detectados antes de confirmar. Puedes corregir cualquier campo.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Número de declaración</label>
              <input
                type="text"
                {...register('numeroDeclaracion')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marca-medio"
              />
              {errors.numeroDeclaracion && (
                <p className="text-xs text-red-600 mt-1">{errors.numeroDeclaracion.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Departamento</label>
              <select
                {...register('departamentoId', { valueAsNumber: true })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marca-medio"
              >
                <option value="">Selecciona...</option>
                {departamentosQuery.data?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
              {errors.departamentoId && (
                <p className="text-xs text-red-600 mt-1">{errors.departamentoId.message}</p>
              )}
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Periodo</label>
            <input
              type="text"
              placeholder="Ej. 2026-08"
              {...register('periodo')}
              className="w-full sm:w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marca-medio"
            />
            {errors.periodo && <p className="text-xs text-red-600 mt-1">{errors.periodo.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Remitente</label>
              <input
                type="text"
                {...register('remitenteNombre')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marca-medio"
              />
              {errors.remitenteNombre && (
                <p className="text-xs text-red-600 mt-1">{errors.remitenteNombre.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">NIT / identificación remitente</label>
              <input
                type="text"
                {...register('remitenteIdentificacion')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marca-medio"
              />
              {errors.remitenteIdentificacion && (
                <p className="text-xs text-red-600 mt-1">{errors.remitenteIdentificacion.message}</p>
              )}
            </div>
          </div>

          <p className="text-xs font-semibold text-marca-oscuro mb-2">Productos declarados</p>
          {fields.map((field, index) => {
            const errorItem = errors.productos?.[index]
            return (
              <div key={field.id} className="border border-gray-200 rounded-lg p-3 mb-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-xs text-gray-500 mb-1">Producto</label>
                    <input
                      type="text"
                      {...register(`productos.${index}.productoNombre`)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-marca-medio"
                    />
                    {errorItem?.productoNombre && (
                      <p className="text-xs text-red-600 mt-1">{errorItem.productoNombre.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Capacidad (ml)</label>
                    <input
                      type="number"
                      step="any"
                      {...register(`productos.${index}.capacidad`, { valueAsNumber: true })}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-marca-medio"
                    />
                    {errorItem?.capacidad && (
                      <p className="text-xs text-red-600 mt-1">{errorItem.capacidad.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                    <input
                      type="number"
                      step="any"
                      {...register(`productos.${index}.cantidad`, { valueAsNumber: true })}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-marca-medio"
                    />
                    {errorItem?.cantidad && (
                      <p className="text-xs text-red-600 mt-1">{errorItem.cantidad.message}</p>
                    )}
                  </div>
                </div>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-xs text-gray-400 hover:text-red-600 transition mt-2"
                  >
                    Quitar producto
                  </button>
                )}
              </div>
            )
          })}
          {errors.productos?.root && (
            <p className="text-xs text-red-600 mb-2">{errors.productos.root.message}</p>
          )}

          <button
            type="button"
            onClick={() => append({ ...declaracionProductoPorDefecto })}
            className="w-full border border-dashed border-marca-medio text-marca-medio text-sm font-semibold py-2 rounded-lg hover:bg-marca-medio/5 transition mb-4"
          >
            + Agregar producto
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancelar}
              className="flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit(onConfirmar)}
              disabled={crearMutation.isPending}
              className="flex-1 bg-marca-oscuro text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {crearMutation.isPending ? 'Creando...' : 'Confirmar y crear lote'}
            </button>
          </div>
        </div>
      )}

      {!documento && (
        <div className="flex justify-end mt-4">
          <button type="button" onClick={onCancelar} className="text-xs text-gray-400 hover:text-gray-600">
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
