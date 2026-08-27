import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { detalleTornaguiaSchema, detalleTornaguiaPorDefecto } from '../schemas'
import type { DetalleTornaguiaFormValues } from '../schemas'
import { SelectorLote } from '../../inventario/components/SelectorLote'

interface ModalDetalleTornaguiaProps {
  titulo: string
  valoresIniciales?: DetalleTornaguiaFormValues
  textoBotonPrincipal: string
  enviando?: boolean
  onCerrar: () => void
  onConfirmar: (values: DetalleTornaguiaFormValues) => void
}

export function ModalDetalleTornaguia({
  titulo,
  valoresIniciales,
  textoBotonPrincipal,
  enviando,
  onCerrar,
  onConfirmar,
}: ModalDetalleTornaguiaProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<DetalleTornaguiaFormValues>({
    resolver: zodResolver(detalleTornaguiaSchema),
    defaultValues: valoresIniciales ?? detalleTornaguiaPorDefecto,
  })

  const loteId = useWatch({ control, name: 'loteId' })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCerrar])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl p-6">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg font-bold text-marca-oscuro">Solicitud de Tornaguía</h2>
          <button
            type="button"
            onClick={onCerrar}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-6">{titulo}</p>

        <form onSubmit={handleSubmit(onConfirmar)}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Remitente</label>
              <input
                type="text"
                {...register('remitenteNombre')}
                placeholder="Nombre o razón social"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-marca-medio"
              />
              {errors.remitenteNombre && (
                <p className="text-xs text-red-600 mt-1">{errors.remitenteNombre.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">NIT / Cédula remitente</label>
              <input
                type="text"
                {...register('remitenteIdentificacion')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-marca-medio"
              />
              {errors.remitenteIdentificacion && (
                <p className="text-xs text-red-600 mt-1">{errors.remitenteIdentificacion.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Destinatario</label>
              <input
                type="text"
                {...register('destinatarioNombre')}
                placeholder="Nombre o razón social"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-marca-medio"
              />
              {errors.destinatarioNombre && (
                <p className="text-xs text-red-600 mt-1">{errors.destinatarioNombre.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">NIT / Cédula destinatario</label>
              <input
                type="text"
                {...register('destinatarioIdentificacion')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-marca-medio"
              />
              {errors.destinatarioIdentificacion && (
                <p className="text-xs text-red-600 mt-1">{errors.destinatarioIdentificacion.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Transportador</label>
              <input
                type="text"
                {...register('transportadorNombre')}
                placeholder="Nombre del conductor"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-marca-medio"
              />
              {errors.transportadorNombre && (
                <p className="text-xs text-red-600 mt-1">{errors.transportadorNombre.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Cédula transportador</label>
              <input
                type="text"
                {...register('transportadorIdentificacion')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-marca-medio"
              />
              {errors.transportadorIdentificacion && (
                <p className="text-xs text-red-600 mt-1">{errors.transportadorIdentificacion.message}</p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">Placa del vehículo</label>
            <input
              type="text"
              {...register('placaVehiculo')}
              placeholder="ABC123"
              className="w-full sm:w-1/2 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-marca-medio"
            />
            {errors.placaVehiculo && <p className="text-xs text-red-600 mt-1">{errors.placaVehiculo.message}</p>}
          </div>

          <div className="mb-6">
            <SelectorLote
              loteId={loteId}
              onCambiar={(nuevoLoteId) => setValue('loteId', nuevoLoteId)}
              errorLoteId={errors.loteId?.message}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 bg-marca-oscuro text-white font-semibold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {enviando ? 'Guardando...' : textoBotonPrincipal}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
