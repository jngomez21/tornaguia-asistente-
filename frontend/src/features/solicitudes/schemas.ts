import { z } from 'zod'

export const nuevaSolicitudSchema = z
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

export type NuevaSolicitudFormValues = z.infer<typeof nuevaSolicitudSchema>
