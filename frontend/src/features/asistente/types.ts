export interface MensajeAsistente {
  rol: 'usuario' | 'asistente'
  contenido: string
  fechaCreacion: string
  conversacionId: string
}

export interface PreguntarResponse {
  respuesta: string
}
