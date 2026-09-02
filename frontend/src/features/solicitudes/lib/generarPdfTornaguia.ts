import type { PDFFont, PDFPage, Color } from 'pdf-lib'
import type { CrearSolicitudResponse, DetalleTornaguiaResponse } from '../types'
import { primerSegmentoDireccion } from '../../../shared/lib/formato'

const ANCHO_PAGINA = 595.28
const MARGEN_X = 55
const ANCHO_TEXTO = ANCHO_PAGINA - MARGEN_X * 2
const CAJA_X = MARGEN_X - 20
const CAJA_ANCHO = ANCHO_PAGINA - CAJA_X * 2
const AZUL_MARCA_RGB: [number, number, number] = [0.043, 0.122, 0.294]
const GRIS_TEXTO_RGB: [number, number, number] = [0.25, 0.25, 0.25]
const GRIS_LINEA_RGB: [number, number, number] = [0.82, 0.82, 0.82]
const PUNTEADO = '..............................'

export interface DatosRutaTornaguia {
  origenDepartamento: string
  origenMunicipio: string
  origenDireccion: string | null
  destinoDepartamento: string | null
  destinoMunicipio: string
  departamentosIntermedios: string[]
}

export async function construirPdfTornaguia(
  resultado: CrearSolicitudResponse,
  detalle: DetalleTornaguiaResponse,
  ruta: DatosRutaTornaguia,
): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
  const AZUL_MARCA = rgb(...AZUL_MARCA_RGB)
  const GRIS_TEXTO = rgb(...GRIS_TEXTO_RGB)
  const GRIS_LINEA = rgb(...GRIS_LINEA_RGB)

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89])
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  let y = 780
  const cajaYInicio = y + 24

  function escribir(texto: string, opciones: { negrita?: boolean; tamano?: number; salto?: number } = {}) {
    const tamano = opciones.tamano ?? 10
    const salto = opciones.salto ?? 16
    const fontActual = opciones.negrita ? fontBold : font
    const color = opciones.negrita ? AZUL_MARCA : GRIS_TEXTO

    for (const linea of dividirEnLineas(sanearParaWinAnsi(texto), fontActual, tamano, ANCHO_TEXTO)) {
      page.drawText(linea, { x: MARGEN_X, y, size: tamano, font: fontActual, color })
      y -= salto
    }
  }

  function escribirCentrado(texto: string, opciones: { negrita?: boolean; tamano?: number; salto?: number } = {}) {
    const tamano = opciones.tamano ?? 10
    const salto = opciones.salto ?? 16
    const fontActual = opciones.negrita ? fontBold : font
    const color = opciones.negrita ? AZUL_MARCA : GRIS_TEXTO
    const ancho = fontActual.widthOfTextAtSize(texto, tamano)
    page.drawText(texto, { x: (ANCHO_PAGINA - ancho) / 2, y, size: tamano, font: fontActual, color })
    y -= salto
  }

  function campo(etiqueta: string, valor: string) {
    const textoEtiqueta = `${etiqueta}: `
    page.drawText(textoEtiqueta, { x: MARGEN_X, y, size: 10, font: fontBold, color: AZUL_MARCA })
    const anchoEtiqueta = fontBold.widthOfTextAtSize(textoEtiqueta, 10)
    page.drawText(sanearParaWinAnsi(valor), {
      x: MARGEN_X + anchoEtiqueta,
      y,
      size: 10,
      font,
      color: GRIS_TEXTO,
    })
    y -= 16
  }

  function campoClaseFecha(clase: string, fecha: string) {
    const mitad = MARGEN_X + ANCHO_TEXTO / 2
    page.drawText('Clase: ', { x: MARGEN_X, y, size: 10, font: fontBold, color: AZUL_MARCA })
    page.drawText(clase, {
      x: MARGEN_X + fontBold.widthOfTextAtSize('Clase: ', 10),
      y,
      size: 10,
      font,
      color: GRIS_TEXTO,
    })
    page.drawText('Fecha: ', { x: mitad, y, size: 10, font: fontBold, color: AZUL_MARCA })
    page.drawText(fecha, {
      x: mitad + fontBold.widthOfTextAtSize('Fecha: ', 10),
      y,
      size: 10,
      font,
      color: GRIS_TEXTO,
    })
    y -= 18
  }

  function divisor() {
    y -= 4
    page.drawLine({
      start: { x: CAJA_X, y },
      end: { x: CAJA_X + CAJA_ANCHO, y },
      thickness: 0.75,
      color: GRIS_LINEA,
    })
    y -= 16
  }

  function tituloSeccion(texto: string) {
    escribir(texto, { negrita: true, tamano: 10.5, salto: 16 })
  }

  // Encabezado
  escribirCentrado('TORNAGUÍA', { negrita: true, tamano: 20, salto: 26 })
  escribirCentrado(`Nº ${generarNumeroTornaguia()}`, { tamano: 11, salto: 22 })
  campoClaseFecha(resultado.tipoTornaguia, formatearFecha(new Date(detalle.fechaGeneracion)))
  divisor()

  // Origen / Destino
  tituloSeccion('ORIGEN')
  escribir(`${ruta.origenDepartamento} · ${ruta.origenMunicipio}`)
  campo('Dirección', ruta.origenDireccion ? primerSegmentoDireccion(ruta.origenDireccion) : PUNTEADO)
  y -= 4
  tituloSeccion('DESTINO')
  escribir(
    ruta.destinoDepartamento ? `${ruta.destinoDepartamento} · ${ruta.destinoMunicipio}` : ruta.destinoMunicipio,
  )
  campo('Dirección', PUNTEADO)
  divisor()

  // Propietario / responsable y destinatario
  tituloSeccion('PROPIETARIO / RESPONSABLE')
  campo('Nombre', detalle.remitenteNombre)
  campo('Identificación', detalle.remitenteIdentificacion)
  y -= 4
  tituloSeccion('DESTINATARIO')
  campo('Nombre', detalle.destinatarioNombre)
  campo('Identificación', detalle.destinatarioIdentificacion)
  divisor()

  // Transporte
  tituloSeccion('TRANSPORTE')
  campo('Empresa', PUNTEADO)
  campo('NIT', PUNTEADO)
  campo('Conductor', `${detalle.transportadorNombre} (CC ${detalle.transportadorIdentificacion})`)
  campo('Vehículo', detalle.placaVehiculo)
  campo('Modalidad', 'Terrestre')
  divisor()

  // Productos
  tituloSeccion('PRODUCTOS')
  y -= 2
  dibujarTablaProductos(page, detalle, font, fontBold, AZUL_MARCA, GRIS_TEXTO, () => y, (nuevaY) => (y = nuevaY))
  divisor()

  // Ruta / entidades territoriales
  tituloSeccion('RUTA / ENTIDADES TERRITORIALES')
  const pasos = [ruta.origenDepartamento, ...ruta.departamentosIntermedios]
  if (ruta.destinoDepartamento) pasos.push(ruta.destinoDepartamento)
  else pasos.push(ruta.destinoMunicipio)
  escribir(deduplicarConsecutivos(pasos).join(' → '))
  divisor()

  // Pie
  campo('Fecha límite de legalización', formatearFecha(calcularFechaLimite(detalle.fechaGeneracion)))
  campo('Código de seguridad', generarCodigoSeguridad())
  y -= 4
  campo('Solicitante', PUNTEADO)
  campo('Funcionario expedidor', PUNTEADO)

  page.drawRectangle({
    x: CAJA_X,
    y: y - 6,
    width: CAJA_ANCHO,
    height: cajaYInicio - (y - 6),
    borderColor: AZUL_MARCA,
    borderWidth: 1,
  })

  return pdfDoc.save()
}

function dibujarTablaProductos(
  page: PDFPage,
  detalle: DetalleTornaguiaResponse,
  font: PDFFont,
  fontBold: PDFFont,
  AZUL_MARCA: Color,
  GRIS_TEXTO: Color,
  obtenerY: () => number,
  fijarY: (y: number) => void,
) {
  const colCodigo = MARGEN_X
  const colProducto = MARGEN_X + 145
  const colCapacidad = MARGEN_X + 300
  const colCantidad = MARGEN_X + 365
  const colImpuesto = MARGEN_X + 420
  const anchoCodigo = colProducto - colCodigo - 8
  const anchoProducto = colCapacidad - colProducto - 8

  let y = obtenerY()

  const encabezados: [string, number][] = [
    ['Código', colCodigo],
    ['Producto', colProducto],
    ['Capacidad', colCapacidad],
    ['Cant.', colCantidad],
    ['Impuesto', colImpuesto],
  ]
  for (const [texto, x] of encabezados) {
    page.drawText(texto, { x, y, size: 9, font: fontBold, color: AZUL_MARCA })
  }
  y -= 14

  for (const producto of detalle.productos) {
    page.drawText(sanearParaWinAnsi(truncarAlAncho(producto.productoCodigo, font, 8, anchoCodigo)), {
      x: colCodigo,
      y,
      size: 8,
      font,
      color: GRIS_TEXTO,
    })
    const fila: [string, number][] = [
      [truncarAlAncho(producto.productoNombre, font, 9, anchoProducto), colProducto],
      [formatearNumero(producto.capacidad), colCapacidad],
      [formatearNumero(producto.cantidad), colCantidad],
      ['$......', colImpuesto],
    ]
    for (const [texto, x] of fila) {
      page.drawText(sanearParaWinAnsi(texto), { x, y, size: 9, font, color: GRIS_TEXTO })
    }
    y -= 15
  }

  fijarY(y - 4)
}

function generarNumeroTornaguia(): string {
  const parte1 = Math.floor(10000 + Math.random() * 90000)
  const parte2 = Math.floor(10000000 + Math.random() * 90000000)
  return `${parte1}-${parte2}`
}

function generarCodigoSeguridad(): string {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let codigo = ''
  for (let i = 0; i < 8; i++) codigo += caracteres[Math.floor(Math.random() * caracteres.length)]
  return codigo
}

function calcularFechaLimite(fechaGeneracion: string): Date {
  const fecha = new Date(fechaGeneracion)
  fecha.setDate(fecha.getDate() + 15)
  return fecha
}

function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatearNumero(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

function truncarAlAncho(texto: string, fontActual: PDFFont, tamano: number, anchoMax: number): string {
  if (fontActual.widthOfTextAtSize(texto, tamano) <= anchoMax) return texto
  const puntosSuspensivos = '...'
  let truncado = texto
  while (truncado.length > 0 && fontActual.widthOfTextAtSize(truncado + puntosSuspensivos, tamano) > anchoMax) {
    truncado = truncado.slice(0, -1)
  }
  return truncado + puntosSuspensivos
}

function deduplicarConsecutivos(valores: string[]): string[] {
  return valores.filter((valor, indice) => indice === 0 || valor !== valores[indice - 1])
}

function sanearParaWinAnsi(texto: string): string {
  return texto.replace(/→/g, '->')
}

function dividirEnLineas(texto: string, fontActual: PDFFont, tamano: number, anchoMax: number): string[] {
  const palabras = texto.split(' ')
  const lineas: string[] = []
  let actual = ''

  for (const palabra of palabras) {
    const candidata = actual === '' ? palabra : `${actual} ${palabra}`
    if (actual !== '' && fontActual.widthOfTextAtSize(candidata, tamano) > anchoMax) {
      lineas.push(actual)
      actual = palabra
    } else {
      actual = candidata
    }
  }
  if (actual !== '') lineas.push(actual)

  return lineas
}

export function bytesABase64(bytes: Uint8Array): string {
  let binario = ''
  const tamanoBloque = 0x8000
  for (let i = 0; i < bytes.length; i += tamanoBloque) {
    binario += String.fromCharCode(...bytes.subarray(i, i + tamanoBloque))
  }
  return btoa(binario)
}

export function descargarPdf(bytes: Uint8Array, nombreArchivo: string) {
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
  URL.revokeObjectURL(url)
}
