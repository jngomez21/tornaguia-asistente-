export function formatearFecha(fechaIso: string): string {
  return new Date(fechaIso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
