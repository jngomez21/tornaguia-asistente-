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

export async function getDashboardGerencial(anio: number | null, departamentoId: number | null): Promise<DashboardGerencial> {
  const response = await api.get<DashboardGerencial>('/gerencial/dashboard', {
    params: { anio: anio ?? undefined, departamentoId: departamentoId ?? undefined },
  })
  return response.data
}

export async function getResumenContribuyente(usuarioId: number, anio: number | null): Promise<ResumenContribuyente> {
  const response = await api.get<ResumenContribuyente>(`/gerencial/contribuyentes/${usuarioId}`, {
    params: anio != null ? { anio } : undefined,
  })
  return response.data
}

export async function getPdfSolicitudGerencial(solicitudId: number): Promise<Uint8Array> {
  const response = await api.get<ArrayBuffer>(`/gerencial/solicitudes/${solicitudId}/pdf`, {
    responseType: 'arraybuffer',
  })
  return new Uint8Array(response.data)
}

export interface DocumentoDeclaracion {
  bytes: Uint8Array
  contentType: string
  nombreArchivo: string
}

export async function getDocumentoDeclaracion(declaracionId: number): Promise<DocumentoDeclaracion> {
  const response = await api.get<ArrayBuffer>(`/gerencial/declaraciones/${declaracionId}/documento`, {
    responseType: 'arraybuffer',
  })
  const disposition = response.headers['content-disposition'] as string | undefined
  const nombreArchivo = disposition?.match(/filename="?([^";]+)"?/)?.[1] ?? `declaracion-${declaracionId}`
  const contentType = (response.headers['content-type'] as string | undefined) ?? 'application/octet-stream'
  return {
    bytes: new Uint8Array(response.data),
    contentType,
    nombreArchivo,
  }
}
