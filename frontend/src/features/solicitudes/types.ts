export interface Municipio {
  id: number
  nombre: string
  departamentoNombre: string
  latitud: number | null
  longitud: number | null
}

export interface Pais {
  id: number
  nombre: string
  codigoISO: string
}

export interface Departamento {
  id: number
  nombre: string
  codigoDane: string
}

export interface CrearSolicitudRequest {
  municipioOrigenId?: number
  municipioDestinoId?: number
  paisDestinoId?: number
  bodegaOrigenId?: number
  bodegaDestinoId?: number
  estaDeclarado: boolean
  esParaExportacion: boolean
}

export interface RutaPreview {
  distanciaKm: number
  tiempoEstimadoMinutos: number
  departamentosIntermedioIds: number[]
  geometria: [number, number][]
}

export interface CrearSolicitudResponse {
  solicitudId: number
  tipoTornaguia: string
  justificacion: string
  distanciaKm: number | null
  tiempoEstimadoMinutos: number | null
  departamentosIntermedios: string[] | null
  geometria: [number, number][] | null
  departamentosIntermedioIds: number[] | null
}

/** Límites de un departamento como MultiPolygon: polígonos -> anillos (0 = exterior, resto = huecos) -> puntos [lon, lat]. */
export interface DepartamentoLimites {
  id: number
  nombre: string
  poligonos: number[][][][]
}

export interface Producto {
  id: number
  nombre: string
  capacidad: number
}

export interface CrearProductoRequest {
  nombre: string
  capacidad: number
}

export interface ProductoTransportadoResponse {
  productoCodigo: string
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
  loteId: number
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
  loteNumeroSerie: string | null
}
