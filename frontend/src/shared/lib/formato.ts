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

export function formatearMonedaCOP(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor)
}

/** Montos en millones para columnas estrechas (tira de KPIs): "$ 1.235 M" en vez de
 * "$ 1.234.567.890", que no cabe. El valor exacto se conserva en el `title` de quien la use. */
export function formatearMonedaCompacta(valor: number): string {
  if (Math.abs(valor) < 1_000_000) return formatearMonedaCOP(valor)

  const millones = valor / 1_000_000
  const decimales = Math.abs(millones) >= 100 ? 0 : 1
  const numero = millones.toLocaleString('es-CO', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })
  return `$ ${numero} M`
}

export function truncarTexto(texto: string, longitudMaxima: number): string {
  const plano = texto.replace(/\s+/g, ' ').trim()
  if (plano.length <= longitudMaxima) return plano

  const cortado = plano.slice(0, longitudMaxima)
  const ultimoEspacio = cortado.lastIndexOf(' ')
  return `${ultimoEspacio > 0 ? cortado.slice(0, ultimoEspacio) : cortado}…`
}
