import { api } from '../../../shared/lib/axios'
import type { Bodega, CrearBodegaRequest, EditarBodegaRequest } from '../types'

export async function getBodegas(): Promise<Bodega[]> {
  const response = await api.get<Bodega[]>('/bodegas')
  return response.data
}

export async function crearBodega(data: CrearBodegaRequest): Promise<Bodega> {
  const response = await api.post<Bodega>('/bodegas', data)
  return response.data
}

export async function editarBodega(bodegaId: number, data: EditarBodegaRequest): Promise<Bodega> {
  const response = await api.put<Bodega>(`/bodegas/${bodegaId}`, data)
  return response.data
}

export async function eliminarBodega(bodegaId: number): Promise<void> {
  await api.delete(`/bodegas/${bodegaId}`)
}
