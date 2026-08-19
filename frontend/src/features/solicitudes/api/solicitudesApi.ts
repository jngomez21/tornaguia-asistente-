import { api } from '../../../shared/lib/axios'
import type { Municipio, Pais, CrearSolicitudRequest, CrearSolicitudResponse } from '../types'

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
