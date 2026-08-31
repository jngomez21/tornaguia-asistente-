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

export interface DeclaracionPrueba {
  bytes: Uint8Array
  numeroDeclaracion: string
}

export async function construirDeclaracionPruebaPdf(departamento: string): Promise<DeclaracionPrueba> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595.28, 841.89])
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const font = await doc.embedFont(StandardFonts.Helvetica)

  let y = 780
  const cajaYInicio = y + 24

  function escribir(texto: string, opciones: { negrita?: boolean; tamano?: number; salto?: number; color?: ReturnType<typeof rgb> } = {}) {
    const tamano = opciones.tamano ?? 10
    const salto = opciones.salto ?? 16
    const fontActual = opciones.negrita ? fontBold : font
    const color = opciones.color ?? (opciones.negrita ? AZUL_MARCA : GRIS_TEXTO)
    page.drawText(texto, { x: MARGEN_X, y, size: tamano, font: fontActual, color })
    y -= salto
  }

  function escribirCentrado(texto: string, opciones: { negrita?: boolean; tamano?: number; salto?: number; color?: ReturnType<typeof rgb> } = {}) {
    const tamano = opciones.tamano ?? 10
    const salto = opciones.salto ?? 16
    const fontActual = opciones.negrita ? fontBold : font
    const color = opciones.color ?? (opciones.negrita ? AZUL_MARCA : GRIS_TEXTO)
    const ancho = fontActual.widthOfTextAtSize(texto, tamano)
    page.drawText(texto, { x: (ANCHO_PAGINA - ancho) / 2, y, size: tamano, font: fontActual, color })
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

  const numeroDeclaracion = generarNumeroDeclaracion()
  const periodo = generarPeriodo()
  const remitente = aleatorio(EMPRESAS)
  const nit = generarNit()

  // Membrete institucional — relleno irrelevante que la IA debe ignorar.
  escribirCentrado('REPUBLICA DE COLOMBIA', { tamano: 9, salto: 12, color: GRIS_CLARO })
  escribirCentrado('GOBERNACION DEPARTAMENTAL - SECRETARIA DE HACIENDA', { tamano: 9, salto: 12, color: GRIS_CLARO })
  escribirCentrado('Sistema de Rentas Departamentales', { tamano: 9, salto: 20, color: GRIS_CLARO })

  // Encabezado
  escribirCentrado('DECLARACION DEL IMPUESTO AL CONSUMO', { negrita: true, tamano: 18, salto: 24 })
  escribirCentrado(`Nº ${numeroDeclaracion}`, { tamano: 11, salto: 22 })
  campoDepartamentoPeriodo(departamento, periodo)
  divisor()

  // Declarante
  tituloSeccion('DECLARANTE')
  campo('Razon social', remitente)
  campo('NIT', nit)
  campo('Direccion', PUNTEADO)
  campo('Correo de notificacion', PUNTEADO)
  divisor()

  // Productos
  tituloSeccion('PRODUCTOS DECLARADOS')
  y -= 2
  const productosElegidos = [...PRODUCTOS].sort(() => Math.random() - 0.5).slice(0, numeroAleatorio(1, 3))
  y = dibujarTablaProductos(page, productosElegidos, font, fontBold, y)
  divisor()

  // Pie
  const radicado = generarRadicado()
  escribir('Este documento no constituye un soporte tributario real. Generado', { tamano: 8, color: GRIS_CLARO, salto: 12 })
  escribir('unicamente con fines de prueba del sistema TornaGuia Asistente.', { tamano: 8, color: GRIS_CLARO, salto: 12 })
  y -= 4
  campo('Sello / firma autorizada', PUNTEADO)
  campo('Radicado electronico', `#${radicado}`)

  page.drawRectangle({
    x: CAJA_X,
    y: y - 6,
    width: CAJA_ANCHO,
    height: cajaYInicio - (y - 6),
    borderColor: AZUL_MARCA,
    borderWidth: 1,
  })

  return { bytes: await doc.save(), numeroDeclaracion }
}

function dibujarTablaProductos(
  page: PDFPage,
  productos: { nombre: string; presentacion: number; unidad: string }[],
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
    const cantidad = numeroAleatorio(20, 500)
    const fila: [string, number][] = [
      [producto.nombre, colProducto],
      [`${producto.presentacion} ${producto.unidad}`, colPresentacion],
      [String(cantidad), colCantidad],
    ]
    for (const [texto, x] of fila) {
      page.drawText(texto, { x, y, size: 9, font, color: GRIS_TEXTO })
    }
    y -= 15
  }

  return y - 4
}
