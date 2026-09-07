export function formatearFecha(fechaIso: string): string {
  return new Date(fechaIso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Primer segmento (antes de la primera coma) de una dirección geocodificada por Mapbox — el
 * resto (municipio, departamento, país) ya se muestra aparte, así que mostrarlo de nuevo es
 * redundante. */
export function primerSegmentoDireccion(direccion: string): string {
  return direccion.split(',')[0].trim()
}

export function truncarTexto(texto: string, longitudMaxima: number): string {
  const plano = texto.replace(/\s+/g, ' ').trim()
  if (plano.length <= longitudMaxima) return plano

  const cortado = plano.slice(0, longitudMaxima)
  const ultimoEspacio = cortado.lastIndexOf(' ')
  return `${ultimoEspacio > 0 ? cortado.slice(0, ultimoEspacio) : cortado}…`
}
