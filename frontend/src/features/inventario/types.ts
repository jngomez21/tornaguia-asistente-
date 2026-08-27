export interface InventarioItem {
  productoId: number
  productoNombre: string
  cantidadDisponible: number
}

export interface RegistrarEntradaRequest {
  bodegaId: number
  productoId: number
  cantidad: number
}

export interface EditarInventarioRequest {
  bodegaId: number
  cantidadDisponible: number
}

export interface LoteProductoRequest {
  productoId: number
  cantidad: number
}

export interface LoteProductoItem {
  productoId: number
  productoNombre: string
  cantidad: number
}

export interface Lote {
  loteId: number
  numeroSerie: string
  estado: string
  fechaCreacion: string
  productos: LoteProductoItem[]
}

export interface CrearLoteRequest {
  bodegaId: number
  productos: LoteProductoRequest[]
}

export interface EditarLoteRequest {
  productos: LoteProductoRequest[]
}
