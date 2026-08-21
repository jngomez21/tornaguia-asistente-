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
  geometria: [number, number][] | null
}

export interface Producto {
  id: number
  nombre: string
}

export interface ProductoTransportadoResponse {
  productoNombre: string
  cantidad: number
  capacidad: number
}

export interface CapacidadPorProductoRequest {
  productoId: number
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
  loteId: number
  capacidades: CapacidadPorProductoRequest[]
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

export interface HistorialSolicitud {
  solicitudId: number
  tipoTornaguia: string
  municipioOrigenNombre: string
  municipioDestinoNombre: string | null
  paisDestinoNombre: string | null
  estaDeclarado: boolean
  esParaExportacion: boolean
  fechaSolicitud: string
  tieneDetalleGenerado: boolean
  tienePdf: boolean
}
