import { api } from '../../../shared/lib/axios'
import type {
  Municipio,
  Pais,
  Producto,
  CrearSolicitudRequest,
  CrearSolicitudResponse,
  GuardarDetalleTornaguiaRequest,
  DetalleTornaguiaResponse,
} from '../types'

export async function getMunicipios(): Promise<Municipio[]> {
  const response = await api.get<Municipio[]>('/municipios')
  return response.data
}

export async function getPaises(): Promise<Pais[]> {
  const response = await api.get<Pais[]>('/paises')
  return response.data
}

export async function crearSolicitud(data: CrearSolicitudRequest): Promise<CrearSolicitudResponse> {
  const response = await api.post<CrearSolicitudResponse>('/solicitudes', data)
  return response.data
}

export async function getProductos(): Promise<Producto[]> {
  const response = await api.get<Producto[]>('/productos')
  return response.data
}

export async function crearProducto(nombre: string): Promise<Producto> {
  const response = await api.post<Producto>('/productos', { nombre })
  return response.data
}

export async function guardarDetalleTornaguia(
  solicitudId: number,
  data: GuardarDetalleTornaguiaRequest,
): Promise<DetalleTornaguiaResponse> {
  const response = await api.post<DetalleTornaguiaResponse>(
    `/solicitudes/${solicitudId}/detalle-tornaguia`,
    data,
  )
  return response.data
}
