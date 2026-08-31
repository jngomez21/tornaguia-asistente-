import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const DEPARTAMENTOS = [
  'ANTIOQUIA', 'CUNDINAMARCA', 'VALLE DEL CAUCA', 'SANTANDER', 'ATLANTICO',
  'BOLIVAR', 'TOLIMA', 'CALDAS', 'RISARALDA', 'NORTE DE SANTANDER',
]

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

export interface DeclaracionPrueba {
  bytes: Uint8Array
  numeroDeclaracion: string
}

export async function construirDeclaracionPruebaPdf(): Promise<DeclaracionPrueba> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595.28, 841.89])
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const font = await doc.embedFont(StandardFonts.Helvetica)

  let y = 800
  function linea(texto: string, opciones: { size?: number; bold?: boolean; salto?: number } = {}) {
    const { size = 10, bold = false, salto = 18 } = opciones
    page.drawText(texto, { x: 55, y, size, font: bold ? fontBold : font, color: rgb(0, 0, 0) })
    y -= salto
  }

  // Encabezado y relleno irrelevante — sirve para probar que la IA lo ignora.
  linea('REPUBLICA DE COLOMBIA', { bold: true, size: 14 })
  linea('GOBERNACION DEPARTAMENTAL - SECRETARIA DE HACIENDA', { size: 9 })
  linea('Sistema de Rentas Departamentales - Impuesto al Consumo', { size: 9 })
  linea('------------------------------------------------------------', { size: 9 })
  linea('DECLARACION Y PAGO DEL IMPUESTO AL CONSUMO', { bold: true, size: 12 })
  y -= 10

  const numeroDeclaracion = generarNumeroDeclaracion()
  const departamento = aleatorio(DEPARTAMENTOS)
  const periodo = generarPeriodo()
  const remitente = aleatorio(EMPRESAS)
  const nit = generarNit()

  linea(`Numero de formulario / declaracion: ${numeroDeclaracion}`)
  linea(`Departamento: ${departamento}`)
  linea(`Periodo gravable: ${periodo}`)
  linea(`Razon social del declarante: ${remitente}`)
  linea(`NIT: ${nit}`)
  linea('Direccion: Calle ficticia # 00-00, Zona Industrial', { size: 9 })
  linea('Correo de notificacion: notificaciones@ejemplo.gov.co', { size: 9 })
  y -= 10

  linea('PRODUCTOS DECLARADOS', { bold: true, size: 11 })
  linea('Producto                          Cantidad   Presentacion', { size: 9 })

  const productosElegidos = [...PRODUCTOS].sort(() => Math.random() - 0.5).slice(0, numeroAleatorio(1, 3))
  for (const p of productosElegidos) {
    const cantidad = numeroAleatorio(20, 500)
    linea(`${p.nombre.padEnd(30)} ${String(cantidad).padStart(6)}     ${p.presentacion} ${p.unidad}`, { size: 9 })
  }

  y -= 10
  linea('Este documento no constituye un soporte tributario real. Generado', { size: 8 })
  linea('unicamente con fines de prueba del sistema TornaGuia Asistente.', { size: 8 })
  linea(`Sello. Firma autorizada. Radicado electronico #${numeroAleatorio(100000, 999999)}`, { size: 8 })

  return { bytes: await doc.save(), numeroDeclaracion }
}
