import { api } from '../../../shared/lib/axios'
import type { MensajeAsistente, PreguntarResponse } from '../types'

export async function getHistorialAsistente(): Promise<MensajeAsistente[]> {
  const response = await api.get<MensajeAsistente[]>('/asistente/historial')
  return response.data
}

export async function preguntarAsistente(pregunta: string, conversacionId: string): Promise<PreguntarResponse> {
  const response = await api.post<PreguntarResponse>('/asistente/preguntar', { pregunta, conversacionId })
  return response.data
}
