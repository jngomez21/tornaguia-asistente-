import { z } from 'zod'

export const direccionEspecificaSchema = z.object({
  texto: z.string(),
  latitud: z.number(),
  longitud: z.number(),
})

export type DireccionEspecificaValue = z.infer<typeof direccionEspecificaSchema>

export const bodegaFormSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es obligatorio.'),
    municipioId: z.number().optional(),
    direccion: direccionEspecificaSchema.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.municipioId) {
      ctx.addIssue({ code: 'custom', path: ['municipioId'], message: 'Selecciona un municipio.' })
    }
  })

export type BodegaFormValues = z.infer<typeof bodegaFormSchema>

export const bodegaFormPorDefecto: BodegaFormValues = {
  nombre: '',
  municipioId: undefined,
  direccion: null,
}
