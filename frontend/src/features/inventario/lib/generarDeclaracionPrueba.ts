import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { PDFFont, PDFPage } from 'pdf-lib'

const ANCHO_PAGINA = 595.28
const MARGEN_X = 55
const ANCHO_TEXTO = ANCHO_PAGINA - MARGEN_X * 2
const CAJA_X = MARGEN_X - 20
const CAJA_ANCHO = ANCHO_PAGINA - CAJA_X * 2
const AZUL_MARCA = rgb(0.043, 0.122, 0.294)
const GRIS_TEXTO = rgb(0.25, 0.25, 0.25)
const GRIS_CLARO = rgb(0.55, 0.55, 0.55)
const GRIS_LINEA = rgb(0.82, 0.82, 0.82)
const PUNTEADO = '..............................'

const PRODUCTOS = [
  { nombre: 'Cerveza Aguila', presentacion: 330, unidad: 'ml' },
  { nombre: 'Cerveza Poker', presentacion: 330, unidad: 'ml' },
  { nombre: 'Cerveza Club Colombia', presentacion: 330, unidad: 'ml' },
  { nombre: 'Ron Medellin', presentacion: 750, unidad: 'ml' },
  { nombre: 'Aguardiente Antioqueno', presentacion: 750, unidad: 'ml' },
  { nombre: 'Whisky Old Parr', presentacion: 750, unidad: 'ml' },
  { nombre: 'Cigarrillos Marlboro', presentacion: 20, unidad: 'unid' },
  { nombre: 'Cigarrillos Boston', presentacion: 20, unidad: 'unid' },
]

const EMPRESAS = [
  'Distribuidora El Faro SAS', 'Comercializadora Andina Ltda',
  'Licores del Norte SAS', 'Bebidas y Mas SAS', 'Comercial Rionegro SAS',
]

function aleatorio<T>(lista: T[]): T {
  return lista[Math.floor(Math.random() * lista.length)]
}

function numeroAleatorio(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generarNumeroDeclaracion(): string {
  return `DDI-${numeroAleatorio(2024, 2026)}-${String(numeroAleatorio(1, 999999)).padStart(6, '0')}`
}

function generarNit(): string {
  return `${numeroAleatorio(800000000, 900000000)}-${numeroAleatorio(0, 9)}`
}

function generarPeriodo(): string {
  const anio = numeroAleatorio(2025, 2026)
  const mes = String(numeroAleatorio(1, 12)).padStart(2, '0')
  return `${anio}-${mes}`
}

function generarRadicado(): string {
  return String(numeroAleatorio(100000, 999999))
}

export interface ProductoDeclarado {
  nombre: string
  presentacion: number
  unidad: string
  cantidad: number
}

export interface DatosDeclaracion {
  numeroDeclaracion: string
  departamento: string
  periodo: string
  remitente: string
  nit: string
  radicado: string
  productos: ProductoDeclarado[]
}

export type VarianteDeclaracion = 1 | 2
export type EstiloImagen = 'foto' | 'escaneado'
export type FormatoDeclaracion = 'pdf-digital' | 'pdf-escaneado' | 'imagen-foto' | 'imagen-escaneada'

export interface DeclaracionPrueba {
  bytes: Uint8Array
  numeroDeclaracion: string
  nombreArchivo: string
  contentType: string
}

/** Datos aleatorios de la declaracion, independientes del formato/variante de renderizado. */
export function generarDatosDeclaracion(departamento: string): DatosDeclaracion {
  const productosElegidos = [...PRODUCTOS].sort(() => Math.random() - 0.5).slice(0, numeroAleatorio(1, 3))
  return {
    numeroDeclaracion: generarNumeroDeclaracion(),
    departamento,
    periodo: generarPeriodo(),
    remitente: aleatorio(EMPRESAS),
    nit: generarNit(),
    radicado: generarRadicado(),
    productos: productosElegidos.map((p) => ({ ...p, cantidad: numeroAleatorio(20, 500) })),
  }
}

/**
 * Genera una declaracion de prueba en formato y variante de diseno aleatorios: PDF "digital" (vectorial),
 * PDF "escaneado" (imagen incrustada, sin texto seleccionable) o imagen tipo foto/escaneo (JPEG).
 */
export async function generarDeclaracionPruebaAleatoria(departamento: string): Promise<DeclaracionPrueba> {
  const datos = generarDatosDeclaracion(departamento)
  const variante: VarianteDeclaracion = aleatorio([1, 2])
  const formato: FormatoDeclaracion = aleatorio(['pdf-digital', 'pdf-escaneado', 'imagen-foto', 'imagen-escaneada'])

  switch (formato) {
    case 'pdf-digital': {
      const bytes = await construirDeclaracionPruebaPdf(datos, variante)
      return { bytes, numeroDeclaracion: datos.numeroDeclaracion, nombreArchivo: `${datos.numeroDeclaracion}.pdf`, contentType: 'application/pdf' }
    }
    case 'pdf-escaneado': {
      const bytes = await construirDeclaracionPruebaPdfEscaneado(datos, variante)
      return { bytes, numeroDeclaracion: datos.numeroDeclaracion, nombreArchivo: `${datos.numeroDeclaracion}.pdf`, contentType: 'application/pdf' }
    }
    case 'imagen-foto': {
      const bytes = await construirDeclaracionPruebaImagen(datos, variante, 'foto')
      return { bytes, numeroDeclaracion: datos.numeroDeclaracion, nombreArchivo: `${datos.numeroDeclaracion}.jpg`, contentType: 'image/jpeg' }
    }
    case 'imagen-escaneada': {
      const bytes = await construirDeclaracionPruebaImagen(datos, variante, 'escaneado')
      return { bytes, numeroDeclaracion: datos.numeroDeclaracion, nombreArchivo: `${datos.numeroDeclaracion}.jpg`, contentType: 'image/jpeg' }
    }
  }
}

export function descargarArchivo(bytes: Uint8Array, nombreArchivo: string, contentType: string) {
  const blob = new Blob([new Uint8Array(bytes)], { type: contentType })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
  URL.revokeObjectURL(url)
}

// --- Formato PDF (formulario institucional en limpio) ---

export async function construirDeclaracionPruebaPdf(
  datos: DatosDeclaracion,
  variante: VarianteDeclaracion = 1,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595.28, 841.89])
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const font = await doc.embedFont(StandardFonts.Helvetica)

  let y = 780
  const cajaYInicio = y + 24

  function escribirCentrado(texto: string, opciones: { negrita?: boolean; tamano?: number; salto?: number; color?: ReturnType<typeof rgb> } = {}) {
    const tamano = opciones.tamano ?? 10
    const salto = opciones.salto ?? 16
    const fontActual = opciones.negrita ? fontBold : font
    const color = opciones.color ?? (opciones.negrita ? AZUL_MARCA : GRIS_TEXTO)
    const ancho = fontActual.widthOfTextAtSize(texto, tamano)
    page.drawText(texto, { x: (ANCHO_PAGINA - ancho) / 2, y, size: tamano, font: fontActual, color })
    y -= salto
  }

  function escribir(texto: string, opciones: { negrita?: boolean; tamano?: number; salto?: number; color?: ReturnType<typeof rgb> } = {}) {
    const tamano = opciones.tamano ?? 10
    const salto = opciones.salto ?? 16
    const fontActual = opciones.negrita ? fontBold : font
    const color = opciones.color ?? (opciones.negrita ? AZUL_MARCA : GRIS_TEXTO)
    page.drawText(texto, { x: MARGEN_X, y, size: tamano, font: fontActual, color })
    y -= salto
  }

  function campo(etiqueta: string, valor: string) {
    const textoEtiqueta = `${etiqueta}: `
    page.drawText(textoEtiqueta, { x: MARGEN_X, y, size: 10, font: fontBold, color: AZUL_MARCA })
    const anchoEtiqueta = fontBold.widthOfTextAtSize(textoEtiqueta, 10)
    page.drawText(valor, { x: MARGEN_X + anchoEtiqueta, y, size: 10, font, color: GRIS_TEXTO })
    y -= 16
  }

  function campoDepartamentoPeriodo(departamento: string, periodo: string) {
    const mitad = MARGEN_X + ANCHO_TEXTO / 2
    page.drawText('Departamento: ', { x: MARGEN_X, y, size: 10, font: fontBold, color: AZUL_MARCA })
    page.drawText(departamento, {
      x: MARGEN_X + fontBold.widthOfTextAtSize('Departamento: ', 10),
      y, size: 10, font, color: GRIS_TEXTO,
    })
    page.drawText('Periodo: ', { x: mitad, y, size: 10, font: fontBold, color: AZUL_MARCA })
    page.drawText(periodo, {
      x: mitad + fontBold.widthOfTextAtSize('Periodo: ', 10),
      y, size: 10, font, color: GRIS_TEXTO,
    })
    y -= 18
  }

  function divisor() {
    y -= 4
    page.drawLine({ start: { x: CAJA_X, y }, end: { x: CAJA_X + CAJA_ANCHO, y }, thickness: 0.75, color: GRIS_LINEA })
    y -= 16
  }

  function tituloSeccion(texto: string) {
    escribir(texto, { negrita: true, tamano: 10.5, salto: 16 })
  }

  // Membrete institucional — relleno irrelevante que la IA debe ignorar.
  escribirCentrado('REPUBLICA DE COLOMBIA', { tamano: 9, salto: 12, color: GRIS_CLARO })
  escribirCentrado('GOBERNACION DEPARTAMENTAL - SECRETARIA DE HACIENDA', { tamano: 9, salto: 12, color: GRIS_CLARO })
  escribirCentrado('Sistema de Rentas Departamentales', { tamano: 9, salto: 20, color: GRIS_CLARO })

  // Encabezado
  escribirCentrado(
    variante === 1 ? 'DECLARACION DEL IMPUESTO AL CONSUMO' : 'FORMULARIO UNICO DEPARTAMENTAL DE CONSUMO',
    { negrita: true, tamano: 18, salto: 24 },
  )
  escribirCentrado(`Nº ${datos.numeroDeclaracion}`, { tamano: 11, salto: 22 })
  campoDepartamentoPeriodo(datos.departamento, datos.periodo)
  divisor()

  // Declarante — la variante 2 invierte el orden de los campos.
  tituloSeccion('DECLARANTE')
  if (variante === 1) {
    campo('Razon social', datos.remitente)
    campo('NIT', datos.nit)
  } else {
    campo('NIT', datos.nit)
    campo('Razon social', datos.remitente)
  }
  campo('Direccion', PUNTEADO)
  campo('Correo de notificacion', PUNTEADO)
  divisor()

  // Productos — tabla en variante 1, lista en variante 2.
  tituloSeccion('PRODUCTOS DECLARADOS')
  y -= 2
  y = variante === 1
    ? dibujarTablaProductos(page, datos.productos, font, fontBold, y)
    : dibujarListaProductos(page, datos.productos, font, fontBold, y)
  divisor()

  // Pie
  escribir('Este documento no constituye un soporte tributario real. Generado', { tamano: 8, color: GRIS_CLARO, salto: 12 })
  escribir('unicamente con fines de prueba del sistema TornaGuia Asistente.', { tamano: 8, color: GRIS_CLARO, salto: 12 })
  y -= 4
  campo('Sello / firma autorizada', PUNTEADO)
  campo('Radicado electronico', `#${datos.radicado}`)

  page.drawRectangle({
    x: CAJA_X,
    y: y - 6,
    width: CAJA_ANCHO,
    height: cajaYInicio - (y - 6),
    borderColor: AZUL_MARCA,
    borderWidth: 1,
  })

  return doc.save()
}

function dibujarTablaProductos(
  page: PDFPage,
  productos: ProductoDeclarado[],
  font: PDFFont,
  fontBold: PDFFont,
  yInicial: number,
): number {
  const colProducto = MARGEN_X
  const colPresentacion = MARGEN_X + 280
  const colCantidad = MARGEN_X + 400

  let y = yInicial

  const encabezados: [string, number][] = [
    ['Producto', colProducto],
    ['Presentacion', colPresentacion],
    ['Cantidad', colCantidad],
  ]
  for (const [texto, x] of encabezados) {
    page.drawText(texto, { x, y, size: 9, font: fontBold, color: AZUL_MARCA })
  }
  y -= 14

  for (const producto of productos) {
    const fila: [string, number][] = [
      [producto.nombre, colProducto],
      [`${producto.presentacion} ${producto.unidad}`, colPresentacion],
      [String(producto.cantidad), colCantidad],
    ]
    for (const [texto, x] of fila) {
      page.drawText(texto, { x, y, size: 9, font, color: GRIS_TEXTO })
    }
    y -= 15
  }

  return y - 4
}

function dibujarListaProductos(
  page: PDFPage,
  productos: ProductoDeclarado[],
  font: PDFFont,
  fontBold: PDFFont,
  yInicial: number,
): number {
  let y = yInicial
  for (const producto of productos) {
    page.drawText('•', { x: MARGEN_X, y, size: 9, font: fontBold, color: AZUL_MARCA })
    page.drawText(
      `${producto.nombre} — ${producto.presentacion} ${producto.unidad} — Cant: ${producto.cantidad}`,
      { x: MARGEN_X + 12, y, size: 9, font, color: GRIS_TEXTO },
    )
    y -= 15
  }
  return y - 4
}

// --- Formato imagen: "foto" (papel sobre una mesa) o "escaneado" (escaner plano, sin fondo/color) ---

async function construirDeclaracionPruebaImagen(
  datos: DatosDeclaracion,
  variante: VarianteDeclaracion,
  estilo: EstiloImagen,
): Promise<Uint8Array> {
  const esEscaneado = estilo === 'escaneado'
  const anchoLienzo = 900
  const altoLienzo = 1273
  const margenPapel = esEscaneado ? 10 : 45

  const canvas = document.createElement('canvas')
  canvas.width = anchoLienzo
  canvas.height = altoLienzo
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el lienzo para la imagen de prueba.')

  // Un escaner plano entrega blanco y negro/gris, sin matices de color ni sombras de escritorio.
  if (esEscaneado) ctx.filter = 'grayscale(1) contrast(1.12) brightness(0.97)'

  ctx.fillStyle = esEscaneado ? '#f2f1ec' : '#dcdcd8'
  ctx.fillRect(0, 0, anchoLienzo, altoLienzo)

  // La foto de celular queda mas torcida que un escaneo (donde la hoja va contra la guia del escaner).
  const anguloGrados = esEscaneado ? numeroAleatorio(-1, 1) : numeroAleatorio(-3, 3)
  ctx.save()
  ctx.translate(anchoLienzo / 2, altoLienzo / 2)
  ctx.rotate((anguloGrados * Math.PI) / 180)
  ctx.translate(-anchoLienzo / 2, -altoLienzo / 2)

  ctx.save()
  if (!esEscaneado) {
    ctx.shadowColor = 'rgba(0,0,0,0.25)'
    ctx.shadowBlur = 30
    ctx.shadowOffsetY = 12
  }
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(margenPapel, margenPapel, anchoLienzo - margenPapel * 2, altoLienzo - margenPapel * 2)
  ctx.restore()

  dibujarContenidoDeclaracionEnCanvas(ctx, datos, variante, margenPapel + 40)

  ctx.restore()

  if (esEscaneado) {
    aplicarVineteado(ctx, anchoLienzo, altoLienzo)
    aplicarLineasEscaneo(ctx, anchoLienzo, altoLienzo)
  }
  aplicarGranoFotografico(ctx, anchoLienzo, altoLienzo)

  const calidad = esEscaneado ? 0.78 : 0.85
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', calidad))
  if (!blob) throw new Error('No se pudo generar la imagen de prueba.')
  return new Uint8Array(await blob.arrayBuffer())
}

/** PDF "escaneado": no tiene texto vectorial, es la imagen tipo escaneo incrustada como pagina completa. */
async function construirDeclaracionPruebaPdfEscaneado(
  datos: DatosDeclaracion,
  variante: VarianteDeclaracion,
): Promise<Uint8Array> {
  const jpegBytes = await construirDeclaracionPruebaImagen(datos, variante, 'escaneado')
  const doc = await PDFDocument.create()
  const jpg = await doc.embedJpg(jpegBytes)
  const escala = ANCHO_PAGINA / jpg.width
  const anchoPagina = jpg.width * escala
  const altoPagina = jpg.height * escala
  const page = doc.addPage([anchoPagina, altoPagina])
  page.drawImage(jpg, { x: 0, y: 0, width: anchoPagina, height: altoPagina })
  return doc.save()
}

function aplicarVineteado(ctx: CanvasRenderingContext2D, ancho: number, alto: number): void {
  const gradiente = ctx.createRadialGradient(
    ancho / 2, alto / 2, Math.min(ancho, alto) * 0.35,
    ancho / 2, alto / 2, Math.max(ancho, alto) * 0.75,
  )
  gradiente.addColorStop(0, 'rgba(0,0,0,0)')
  gradiente.addColorStop(1, 'rgba(0,0,0,0.18)')
  ctx.fillStyle = gradiente
  ctx.fillRect(0, 0, ancho, alto)
}

function aplicarLineasEscaneo(ctx: CanvasRenderingContext2D, ancho: number, alto: number): void {
  ctx.save()
  ctx.globalAlpha = 0.025
  ctx.fillStyle = '#000000'
  for (let y = 0; y < alto; y += 3) {
    ctx.fillRect(0, y, ancho, 1)
  }
  ctx.restore()
}

function dibujarContenidoDeclaracionEnCanvas(
  ctx: CanvasRenderingContext2D,
  datos: DatosDeclaracion,
  variante: VarianteDeclaracion,
  margenX: number,
): void {
  const anchoUtil = ctx.canvas.width - margenX * 2
  let y = 90

  function centrado(texto: string, tamano: number, negrita: boolean, color: string, salto: number) {
    ctx.font = `${negrita ? 'bold ' : ''}${tamano}px Arial`
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.fillText(texto, ctx.canvas.width / 2, y)
    ctx.textAlign = 'left'
    y += salto
  }

  function campo(etiqueta: string, valor: string) {
    ctx.font = 'bold 15px Arial'
    ctx.fillStyle = '#0b1f4b'
    ctx.fillText(`${etiqueta}: `, margenX, y)
    const anchoEtiqueta = ctx.measureText(`${etiqueta}: `).width
    ctx.font = '15px Arial'
    ctx.fillStyle = '#404040'
    ctx.fillText(valor, margenX + anchoEtiqueta, y)
    y += 26
  }

  function divisor() {
    y += 6
    ctx.strokeStyle = '#d1d1d1'
    ctx.beginPath()
    ctx.moveTo(margenX - 20, y)
    ctx.lineTo(margenX - 20 + anchoUtil + 40, y)
    ctx.stroke()
    y += 26
  }

  function titulo(texto: string) {
    ctx.font = 'bold 16px Arial'
    ctx.fillStyle = '#0b1f4b'
    ctx.fillText(texto, margenX, y)
    y += 26
  }

  centrado('REPUBLICA DE COLOMBIA', 13, false, '#8c8c8c', 18)
  centrado('GOBERNACION DEPARTAMENTAL - SECRETARIA DE HACIENDA', 13, false, '#8c8c8c', 18)
  centrado('Sistema de Rentas Departamentales', 13, false, '#8c8c8c', 32)

  centrado(
    variante === 1 ? 'DECLARACION DEL IMPUESTO AL CONSUMO' : 'FORMULARIO UNICO DEPARTAMENTAL DE CONSUMO',
    27, true, '#0b1f4b', 38,
  )
  centrado(`Nº ${datos.numeroDeclaracion}`, 16, false, '#404040', 34)

  campo('Departamento', datos.departamento)
  campo('Periodo', datos.periodo)
  divisor()

  titulo('DECLARANTE')
  if (variante === 1) {
    campo('Razon social', datos.remitente)
    campo('NIT', datos.nit)
  } else {
    campo('NIT', datos.nit)
    campo('Razon social', datos.remitente)
  }
  campo('Direccion', PUNTEADO)
  campo('Correo de notificacion', PUNTEADO)
  divisor()

  titulo('PRODUCTOS DECLARADOS')
  for (const producto of datos.productos) {
    ctx.font = '15px Arial'
    ctx.fillStyle = '#404040'
    ctx.fillText(
      `• ${producto.nombre} — ${producto.presentacion} ${producto.unidad} — Cant: ${producto.cantidad}`,
      margenX,
      y,
    )
    y += 24
  }
  divisor()

  ctx.font = '12px Arial'
  ctx.fillStyle = '#8c8c8c'
  ctx.fillText('Este documento no constituye un soporte tributario real. Generado', margenX, y)
  y += 16
  ctx.fillText('unicamente con fines de prueba del sistema TornaGuia Asistente.', margenX, y)
  y += 30

  campo('Radicado electronico', `#${datos.radicado}`)
}

function aplicarGranoFotografico(ctx: CanvasRenderingContext2D, ancho: number, alto: number): void {
  const puntos = 900
  for (let i = 0; i < puntos; i++) {
    const x = Math.random() * ancho
    const y = Math.random() * alto
    const opacidad = Math.random() * 0.04
    ctx.fillStyle = Math.random() < 0.5 ? `rgba(0,0,0,${opacidad})` : `rgba(255,255,255,${opacidad})`
    ctx.fillRect(x, y, 1, 1)
  }
}
