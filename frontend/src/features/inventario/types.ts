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

export interface DeclaracionResumen {
  numeroDeclaracion: string
  remitenteNombre: string
  remitenteIdentificacion: string
}

export interface Lote {
  loteId: number
  numeroSerie: string
  estado: string
  fechaCreacion: string
  productos: LoteProductoItem[]
  declaracion: DeclaracionResumen | null
}

export interface CrearLoteRequest {
  bodegaId: number
  productos: LoteProductoRequest[]
}

export interface EditarLoteRequest {
  productos: LoteProductoRequest[]
}

export interface ProductoPropuestoDeclaracion {
  nombreDetectado: string
  productoIdCoincidente: number | null
  capacidadCoincidente: number | null
  cantidad: number
  capacidadDetectada: number | null
}

export interface PropuestaDeclaracion {
  numeroDeclaracion: string | null
  departamentoId: number | null
  departamentoNombreDetectado: string | null
  periodo: string | null
  remitenteNombre: string | null
  remitenteIdentificacion: string | null
  productos: ProductoPropuestoDeclaracion[]
}

export interface ProponerDeclaracionRequest {
  documentoBytes: string
  documentoContentType: string
}

export interface ProductoDeclaradoRequest {
  productoNombre: string
  capacidad: number
  cantidad: number
}

export interface CrearLoteDesdeDeclaracionRequest {
  bodegaId: number
  numeroDeclaracion: string
  departamentoId: number
  periodo: string
  remitenteNombre: string
  remitenteIdentificacion: string
  documentoBytes: string
  documentoNombreArchivo: string
  documentoContentType: string
  productos: ProductoDeclaradoRequest[]
}
