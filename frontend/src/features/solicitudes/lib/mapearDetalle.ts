import type { DetalleTornaguiaFormValues } from '../schemas'
import type { GuardarDetalleTornaguiaRequest } from '../types'

export function mapearDetalleARequest(values: DetalleTornaguiaFormValues): GuardarDetalleTornaguiaRequest {
  return {
    remitenteNombre: values.remitenteNombre,
    remitenteIdentificacion: values.remitenteIdentificacion,
    destinatarioNombre: values.destinatarioNombre,
    destinatarioIdentificacion: values.destinatarioIdentificacion,
    transportadorNombre: values.transportadorNombre,
    transportadorIdentificacion: values.transportadorIdentificacion,
    placaVehiculo: values.placaVehiculo,
    loteId: values.loteId!,
  }
}
