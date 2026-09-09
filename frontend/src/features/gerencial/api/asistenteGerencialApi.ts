import { api } from '../../../shared/lib/axios'
import type { MensajeAsistente, PreguntarResponse } from '../../asistente/types'

export async function getHistorialAsistenteGerencial(): Promise<MensajeAsistente[]> {
  const response = await api.get<MensajeAsistente[]>('/gerencial/asistente/historial')
  return response.data
}

export async function preguntarAsistenteGerencial(pregunta: string, conversacionId: string): Promise<PreguntarResponse> {
  const response = await api.post<PreguntarResponse>('/gerencial/asistente/preguntar', { pregunta, conversacionId })
  return response.data
}
