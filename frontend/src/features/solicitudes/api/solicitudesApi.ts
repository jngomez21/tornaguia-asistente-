import { api } from '../../../shared/lib/axios'
import type {
  Municipio,
  Pais,
  Producto,
  CrearProductoRequest,
  CrearSolicitudRequest,
  CrearSolicitudResponse,
  GuardarDetalleTornaguiaRequest,
  DetalleTornaguiaResponse,
  HistorialSolicitud,
  RutaPreview,
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

export async function calcularRuta(origenId: number, destinoId: number): Promise<RutaPreview> {
  const response = await api.get<RutaPreview>('/rutas/calcular', { params: { origenId, destinoId } })
  return response.data
}

export async function getProductos(): Promise<Producto[]> {
  const response = await api.get<Producto[]>('/productos')
  return response.data
}

export async function crearProducto(data: CrearProductoRequest): Promise<Producto> {
  const response = await api.post<Producto>('/productos', data)
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

export async function getHistorialSolicitudes(): Promise<HistorialSolicitud[]> {
  const response = await api.get<HistorialSolicitud[]>('/solicitudes')
  return response.data
}

export async function getSolicitud(solicitudId: number): Promise<CrearSolicitudResponse> {
  const response = await api.get<CrearSolicitudResponse>(`/solicitudes/${solicitudId}`)
  return response.data
}

export async function guardarPdfTornaguia(solicitudId: number, pdfBase64: string): Promise<void> {
  await api.put(`/solicitudes/${solicitudId}/pdf`, { pdfBytes: pdfBase64 })
}

export async function getPdfTornaguia(solicitudId: number): Promise<Uint8Array> {
  const response = await api.get<ArrayBuffer>(`/solicitudes/${solicitudId}/pdf`, {
    responseType: 'arraybuffer',
  })
  return new Uint8Array(response.data)
}
