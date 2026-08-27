import { z } from 'zod'

export const solicitudItemSchema = z
  .object({
    municipioOrigenId: z.number().optional(),
    tipoDestino: z.enum(['municipio', 'pais']),
    municipioDestinoId: z.number().optional(),
    paisDestinoId: z.number().optional(),
    estaDeclarado: z.boolean(),
    esParaExportacion: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.municipioOrigenId) {
      ctx.addIssue({
        code: 'custom',
        path: ['municipioOrigenId'],
        message: 'Selecciona el municipio de origen.',
      })
    }

    if (data.tipoDestino === 'municipio') {
      if (!data.municipioDestinoId) {
        ctx.addIssue({
          code: 'custom',
          path: ['municipioDestinoId'],
          message: 'Selecciona el municipio de destino.',
        })
      } else if (data.municipioDestinoId === data.municipioOrigenId) {
        ctx.addIssue({
          code: 'custom',
          path: ['municipioDestinoId'],
          message: 'El destino debe ser diferente al origen.',
        })
      }
    } else if (!data.paisDestinoId) {
      ctx.addIssue({
        code: 'custom',
        path: ['paisDestinoId'],
        message: 'Selecciona el país de destino.',
      })
    }
  })

export const nuevaSolicitudFormSchema = z.object({
  solicitudes: z.array(solicitudItemSchema).min(1),
})

export type SolicitudItemFormValues = z.infer<typeof solicitudItemSchema>
export type NuevaSolicitudFormValues = z.infer<typeof nuevaSolicitudFormSchema>

export const solicitudItemPorDefecto: SolicitudItemFormValues = {
  municipioOrigenId: undefined,
  tipoDestino: 'municipio',
  municipioDestinoId: undefined,
  paisDestinoId: undefined,
  estaDeclarado: false,
  esParaExportacion: false,
}

export const detalleTornaguiaSchema = z
  .object({
    remitenteNombre: z.string().min(1, 'Campo requerido.'),
    remitenteIdentificacion: z.string().min(1, 'Campo requerido.'),
    destinatarioNombre: z.string().min(1, 'Campo requerido.'),
    destinatarioIdentificacion: z.string().min(1, 'Campo requerido.'),
    transportadorNombre: z.string().min(1, 'Campo requerido.'),
    transportadorIdentificacion: z.string().min(1, 'Campo requerido.'),
    placaVehiculo: z.string().min(1, 'Campo requerido.'),
    loteId: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.loteId) {
      ctx.addIssue({ code: 'custom', path: ['loteId'], message: 'Selecciona o crea un lote.' })
    }
  })

export type DetalleTornaguiaFormValues = z.infer<typeof detalleTornaguiaSchema>

export const detalleTornaguiaPorDefecto: DetalleTornaguiaFormValues = {
  remitenteNombre: '',
  remitenteIdentificacion: '',
  destinatarioNombre: '',
  destinatarioIdentificacion: '',
  transportadorNombre: '',
  transportadorIdentificacion: '',
  placaVehiculo: '',
  loteId: undefined,
}
