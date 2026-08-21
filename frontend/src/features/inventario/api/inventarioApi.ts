import { api } from '../../../shared/lib/axios'
import type {
  InventarioItem,
  RegistrarEntradaRequest,
  Lote,
  CrearLoteRequest,
  EditarLoteRequest,
} from '../types'

export async function getInventario(): Promise<InventarioItem[]> {
  const response = await api.get<InventarioItem[]>('/inventario')
  return response.data
}

export async function registrarEntrada(data: RegistrarEntradaRequest): Promise<InventarioItem> {
  const response = await api.post<InventarioItem>('/inventario/entradas', data)
  return response.data
}

export async function getLotesDisponibles(): Promise<Lote[]> {
  const response = await api.get<Lote[]>('/inventario/lotes')
  return response.data
}

export async function crearLote(data: CrearLoteRequest): Promise<Lote> {
  const response = await api.post<Lote>('/inventario/lotes', data)
  return response.data
}

export async function editarLote(loteId: number, data: EditarLoteRequest): Promise<Lote> {
  const response = await api.put<Lote>(`/inventario/lotes/${loteId}`, data)
  return response.data
}

export async function cancelarLote(loteId: number): Promise<void> {
  await api.post(`/inventario/lotes/${loteId}/cancelar`)
}
