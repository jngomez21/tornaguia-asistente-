import { z } from 'zod'
import type { LoteProductoRequest, PropuestaDeclaracion, ProductoDeclaradoRequest } from './types'

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

const productoDeclaradoBaseSchema = z.object({
  productoNombre: z.string(),
  capacidad: z.number(),
  cantidad: z.number(),
})

export const productoDeclaradoSchema = productoDeclaradoBaseSchema.superRefine((data, ctx) => {
  if (!data.productoNombre.trim()) {
    ctx.addIssue({ code: 'custom', path: ['productoNombre'], message: 'Requerido.' })
  }
  if (!Number.isFinite(data.capacidad) || data.capacidad <= 0) {
    ctx.addIssue({ code: 'custom', path: ['capacidad'], message: 'Debe ser mayor a 0.' })
  }
  if (!Number.isFinite(data.cantidad) || data.cantidad <= 0) {
    ctx.addIssue({ code: 'custom', path: ['cantidad'], message: 'Debe ser mayor a 0.' })
  }
})

export const declaracionFormSchema = z.object({
  numeroDeclaracion: z.string(),
  departamentoId: z.number().optional(),
  periodo: z.string(),
  remitenteNombre: z.string(),
  remitenteIdentificacion: z.string(),
  productos: z.array(productoDeclaradoSchema).min(1, 'Agrega al menos un producto.'),
}).superRefine((data, ctx) => {
  if (!data.numeroDeclaracion.trim()) {
    ctx.addIssue({ code: 'custom', path: ['numeroDeclaracion'], message: 'Requerido.' })
  }
  if (!data.departamentoId) {
    ctx.addIssue({ code: 'custom', path: ['departamentoId'], message: 'Selecciona un departamento.' })
  }
  if (!data.periodo.trim()) {
    ctx.addIssue({ code: 'custom', path: ['periodo'], message: 'Requerido.' })
  }
  if (!data.remitenteNombre.trim()) {
    ctx.addIssue({ code: 'custom', path: ['remitenteNombre'], message: 'Requerido.' })
  }
  if (!data.remitenteIdentificacion.trim()) {
    ctx.addIssue({ code: 'custom', path: ['remitenteIdentificacion'], message: 'Requerido.' })
  }
})

export type DeclaracionFormValues = z.infer<typeof declaracionFormSchema>

export const declaracionProductoPorDefecto = { productoNombre: '', capacidad: NaN, cantidad: NaN }

export function propuestaAValoresFormulario(propuesta: PropuestaDeclaracion): DeclaracionFormValues {
  return {
    numeroDeclaracion: propuesta.numeroDeclaracion ?? '',
    departamentoId: propuesta.departamentoId ?? undefined,
    periodo: propuesta.periodo ?? '',
    remitenteNombre: propuesta.remitenteNombre ?? '',
    remitenteIdentificacion: propuesta.remitenteIdentificacion ?? '',
    productos:
      propuesta.productos.length > 0
        ? propuesta.productos.map((p) => ({
            productoNombre: p.nombreDetectado,
            capacidad: p.capacidadCoincidente ?? p.capacidadDetectada ?? NaN,
            cantidad: p.cantidad,
          }))
        : [declaracionProductoPorDefecto],
  }
}

export function productosDeclaradosParaRequest(values: DeclaracionFormValues): ProductoDeclaradoRequest[] {
  return values.productos.map((p) => ({
    productoNombre: p.productoNombre,
    capacidad: p.capacidad,
    cantidad: p.cantidad,
  }))
}
