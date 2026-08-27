export interface Bodega {
  id: number
  nombre: string
  municipioId: number
  municipioNombre: string
  departamentoNombre: string
  latitud: number | null
  longitud: number | null
}

export interface CrearBodegaRequest {
  nombre: string
  municipioId: number
}

export interface EditarBodegaRequest {
  nombre: string
  municipioId: number
}
