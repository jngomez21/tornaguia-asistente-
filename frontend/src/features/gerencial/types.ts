export interface ResumenGerencial {
  totalTornaguias: number
  impuestoRecaudado: number
  impuestoPorCausar: number
  impuestoEnTornaguias: number
  totalContribuyentes: number
  totalBodegas: number
  lotesReservados: number
  aniosDisponibles: number[]
}

export interface PuntoSerieMensual {
  anio: number
  mes: number
  tornaguias: number
  impuesto: number
}

export interface DistribucionTipo {
  tipo: string
  cantidad: number
  impuesto: number
}

export interface VolumenDepartamento {
  departamentoId: number
  codigoDane: string
  nombre: string
  cantidad: number
  impuesto: number
}

export interface TopProducto {
  productoId: number
  productoNombre: string
  impuesto: number
  unidades: number
}

export interface TopRuta {
  origen: string
  destino: string
  cantidad: number
}

/** Sin correo: el módulo gerencial nunca necesita ni muestra PII de contacto. */
export interface ContribuyenteResumen {
  usuarioId: number
  nombre: string
  tornaguias: number
  impuesto: number
  ultimaActividad: string | null
}

export interface DashboardGerencial {
  resumen: ResumenGerencial
  serieMensual: PuntoSerieMensual[]
  distribucionPorTipo: DistribucionTipo[]
  volumenPorDepartamento: VolumenDepartamento[]
  topProductos: TopProducto[]
  topRutas: TopRuta[]
  contribuyentes: ContribuyenteResumen[]
}

export interface ResumenContribuyente {
  usuarioId: number
  nombre: string
  totalBodegas: number
  lotesReservados: number
  impuestoRecaudado: number
  impuestoPorCausar: number
  porTipo: DistribucionTipo[]
}
