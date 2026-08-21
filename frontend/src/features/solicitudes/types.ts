export interface Municipio {
  id: number
  nombre: string
  departamentoNombre: string
}

export interface Pais {
  id: number
  nombre: string
  codigoISO: string
}

export interface CrearSolicitudRequest {
  municipioOrigenId: number
  municipioDestinoId?: number
  paisDestinoId?: number
  estaDeclarado: boolean
  esParaExportacion: boolean
}

export interface CrearSolicitudResponse {
  solicitudId: number
  tipoTornaguia: string
  justificacion: string
  distanciaKm: number | null
  tiempoEstimadoMinutos: number | null
  departamentosIntermedios: string[] | null
}

export interface Producto {
  id: number
  nombre: string
}

export interface ProductoTransportadoRequest {
  productoId: number
  cantidad: number
  capacidad: number
}

export interface ProductoTransportadoResponse {
  productoNombre: string
  cantidad: number
  capacidad: number
}

export interface GuardarDetalleTornaguiaRequest {
  remitenteNombre: string
  remitenteIdentificacion: string
  destinatarioNombre: string
  destinatarioIdentificacion: string
  transportadorNombre: string
  transportadorIdentificacion: string
  placaVehiculo: string
  productos: ProductoTransportadoRequest[]
}

export interface DetalleTornaguiaResponse {
  solicitudId: number
  remitenteNombre: string
  remitenteIdentificacion: string
  destinatarioNombre: string
  destinatarioIdentificacion: string
  transportadorNombre: string
  transportadorIdentificacion: string
  placaVehiculo: string
  fechaGeneracion: string
  productos: ProductoTransportadoResponse[]
}
