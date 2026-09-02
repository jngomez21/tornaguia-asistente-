export interface Bodega {
  id: number
  nombre: string
  municipioId: number
  municipioNombre: string
  departamentoNombre: string
  direccionEspecifica: string | null
  latitud: number | null
  longitud: number | null
  lotesActivos: number
  productosDistintos: number
}

export interface CrearBodegaRequest {
  nombre: string
  municipioId: number
  direccionEspecifica?: string | null
  direccionLatitud?: number | null
  direccionLongitud?: number | null
}

export interface EditarBodegaRequest {
  nombre: string
  municipioId: number
  direccionEspecifica?: string | null
  direccionLatitud?: number | null
  direccionLongitud?: number | null
}
