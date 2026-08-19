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
