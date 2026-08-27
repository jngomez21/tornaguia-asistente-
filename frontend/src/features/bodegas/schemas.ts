import { z } from 'zod'

export const bodegaFormSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es obligatorio.'),
    municipioId: z.number().optional(),
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
}
