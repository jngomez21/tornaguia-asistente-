import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { PDFFont } from 'pdf-lib'
import type { CrearSolicitudResponse, DetalleTornaguiaResponse } from '../types'

const ANCHO_PAGINA = 595.28
const MARGEN_X = 50
const ANCHO_MAX_TEXTO = ANCHO_PAGINA - MARGEN_X * 2
const AZUL_MARCA = rgb(0.043, 0.122, 0.294)
const GRIS_TEXTO = rgb(0.25, 0.25, 0.25)

export async function construirPdfTornaguia(
  resultado: CrearSolicitudResponse,
  detalle: DetalleTornaguiaResponse,
  etiqueta: string,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89])
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  let y = 792

  function escribir(texto: string, opciones: { negrita?: boolean; tamano?: number; salto?: number } = {}) {
    const tamano = opciones.tamano ?? 11
    const salto = opciones.salto ?? 18
    const fontActual = opciones.negrita ? fontBold : font
    const color = opciones.negrita ? AZUL_MARCA : GRIS_TEXTO

    for (const linea of dividirEnLineas(sanearParaWinAnsi(texto), fontActual, tamano)) {
      page.drawText(linea, { x: MARGEN_X, y, size: tamano, font: fontActual, color })
      y -= salto
    }
  }

  function seccion(titulo: string) {
    y -= 6
    escribir(titulo, { negrita: true, tamano: 12, salto: 18 })
  }

  escribir('TornaGuía Asistente', { negrita: true, tamano: 18, salto: 26 })
  escribir(`Tornaguía de ${resultado.tipoTornaguia}`, { negrita: true, tamano: 14, salto: 20 })
  escribir(`Solicitud #${resultado.solicitudId} — ${etiqueta}`, { tamano: 10, salto: 24 })

  seccion('Justificación')
  escribir(resultado.justificacion, { tamano: 10, salto: 20 })

  if (resultado.departamentosIntermedios?.length) {
    escribir(`Departamentos intermedios: ${resultado.departamentosIntermedios.join(', ')}`, {
      tamano: 10,
      salto: 20,
    })
  }

  seccion('Remitente')
  escribir(`${detalle.remitenteNombre} — ${detalle.remitenteIdentificacion}`, { tamano: 10, salto: 20 })

  seccion('Destinatario')
  escribir(`${detalle.destinatarioNombre} — ${detalle.destinatarioIdentificacion}`, { tamano: 10, salto: 20 })

  seccion('Transportador')
  escribir(`${detalle.transportadorNombre} — ${detalle.transportadorIdentificacion}`, { tamano: 10, salto: 16 })
  escribir(`Placa del vehículo: ${detalle.placaVehiculo}`, { tamano: 10, salto: 20 })

  seccion('Productos transportados')
  for (const producto of detalle.productos) {
    escribir(`• ${producto.productoNombre} — Cantidad: ${producto.cantidad} · Capacidad: ${producto.capacidad}`, {
      tamano: 10,
      salto: 16,
    })
  }

  y -= 16
  escribir(`Fecha de generación: ${new Date(detalle.fechaGeneracion).toLocaleString('es-CO')}`, {
    tamano: 9,
    salto: 16,
  })

  return pdfDoc.save()
}

function sanearParaWinAnsi(texto: string): string {
  return texto.replace(/→/g, '->')
}

function dividirEnLineas(texto: string, fontActual: PDFFont, tamano: number): string[] {
  const palabras = texto.split(' ')
  const lineas: string[] = []
  let actual = ''

  for (const palabra of palabras) {
    const candidata = actual === '' ? palabra : `${actual} ${palabra}`
    if (actual !== '' && fontActual.widthOfTextAtSize(candidata, tamano) > ANCHO_MAX_TEXTO) {
      lineas.push(actual)
      actual = palabra
    } else {
      actual = candidata
    }
  }
  if (actual !== '') lineas.push(actual)

  return lineas
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
