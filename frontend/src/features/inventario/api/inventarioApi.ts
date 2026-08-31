import { api } from '../../../shared/lib/axios'
import type {
  InventarioItem,
  RegistrarEntradaRequest,
  EditarInventarioRequest,
  Lote,
  CrearLoteRequest,
  EditarLoteRequest,
  PropuestaDeclaracion,
  ProponerDeclaracionRequest,
  CrearLoteDesdeDeclaracionRequest,
} from '../types'

export async function getInventario(bodegaId: number): Promise<InventarioItem[]> {
  const response = await api.get<InventarioItem[]>('/inventario', { params: { bodegaId } })
  return response.data
}

export async function registrarEntrada(data: RegistrarEntradaRequest): Promise<InventarioItem> {
  const response = await api.post<InventarioItem>('/inventario/entradas', data)
  return response.data
}

export async function editarInventario(productoId: number, data: EditarInventarioRequest): Promise<InventarioItem> {
  const response = await api.put<InventarioItem>(`/inventario/${productoId}`, data)
  return response.data
}

export async function getLotesDisponibles(bodegaId?: number): Promise<Lote[]> {
  const response = await api.get<Lote[]>('/inventario/lotes', { params: bodegaId != null ? { bodegaId } : undefined })
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

export async function proponerDeclaracion(data: ProponerDeclaracionRequest): Promise<PropuestaDeclaracion> {
  const response = await api.post<PropuestaDeclaracion>('/inventario/lotes/declaraciones/proponer', data)
  return response.data
}

export async function crearLoteDesdeDeclaracion(data: CrearLoteDesdeDeclaracionRequest): Promise<Lote> {
  const response = await api.post<Lote>('/inventario/lotes/desde-declaracion', data)
  return response.data
}
