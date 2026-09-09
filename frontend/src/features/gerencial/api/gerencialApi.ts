import { api } from '../../../shared/lib/axios'
import type { DepartamentoLimites } from '../../solicitudes/types'
import type { DashboardGerencial, ResumenContribuyente } from '../types'

// Todos los ids de una vez: a diferencia del mapa de rutas (que cachea departamento por
// departamento porque solo necesita los que cruza una ruta puntual), el coroplético necesita
// los ~33 departamentos del país siempre, así que una sola llamada por sesión basta.
export async function getLimitesDepartamentos(departamentoIds: number[]): Promise<DepartamentoLimites[]> {
  const response = await api.get<DepartamentoLimites[]>('/departamentos/limites', {
    params: { ids: departamentoIds.join(',') },
  })
  return response.data
}

export async function getDashboardGerencial(anio: number | null): Promise<DashboardGerencial> {
  const response = await api.get<DashboardGerencial>('/gerencial/dashboard', {
    params: anio != null ? { anio } : undefined,
  })
  return response.data
}

export async function getResumenContribuyente(usuarioId: number, anio: number | null): Promise<ResumenContribuyente> {
  const response = await api.get<ResumenContribuyente>(`/gerencial/contribuyentes/${usuarioId}`, {
    params: anio != null ? { anio } : undefined,
  })
  return response.data
}
