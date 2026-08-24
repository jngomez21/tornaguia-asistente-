import { z } from 'zod'
import type { LoteProductoRequest } from './types'

const entradaBaseSchema = z.object({
  productoId: z.number().optional(),
  productoNombre: z.string(),
  cantidad: z.number(),
})

export const entradaSchema = entradaBaseSchema.superRefine((data, ctx) => {
  if (!data.productoId) {
    ctx.addIssue({ code: 'custom', path: ['productoId'], message: 'Selecciona o crea un producto.' })
  }
  if (!Number.isFinite(data.cantidad) || data.cantidad <= 0) {
    ctx.addIssue({ code: 'custom', path: ['cantidad'], message: 'Debe ser mayor a 0.' })
  }
})

export type EntradaFormValues = z.infer<typeof entradaSchema>

export const entradaPorDefecto: EntradaFormValues = {
  productoId: undefined,
  productoNombre: '',
  cantidad: NaN,
}

const loteProductoBaseSchema = z.object({
  productoId: z.number().optional(),
  productoNombre: z.string(),
  cantidad: z.number(),
})

export const loteProductoSchema = loteProductoBaseSchema.superRefine((data, ctx) => {
  if (!data.productoId) {
    ctx.addIssue({ code: 'custom', path: ['productoId'], message: 'Selecciona o crea un producto.' })
  }
  if (!Number.isFinite(data.cantidad) || data.cantidad <= 0) {
    ctx.addIssue({ code: 'custom', path: ['cantidad'], message: 'Debe ser mayor a 0.' })
  }
})

export const loteFormSchema = z.object({
  productos: z.array(loteProductoSchema).min(1, 'Agrega al menos un producto.'),
})

export type LoteProductoFormValues = z.infer<typeof loteProductoSchema>
export type LoteFormValues = z.infer<typeof loteFormSchema>

export const loteProductoPorDefecto: LoteProductoFormValues = {
  productoId: undefined,
  productoNombre: '',
  cantidad: NaN,
}

export const loteFormPorDefecto: LoteFormValues = {
  productos: [loteProductoPorDefecto],
}

export function productosParaRequest(values: LoteFormValues): LoteProductoRequest[] {
  return values.productos.map((p) => ({ productoId: p.productoId!, cantidad: p.cantidad }))
}
