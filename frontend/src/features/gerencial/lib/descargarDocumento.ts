// Igual que descargarPdf (features/solicitudes/lib/generarPdfTornaguia.ts) pero con el
// content-type real: el documento de una declaración no siempre es un PDF.
export function descargarDocumento(bytes: Uint8Array, contentType: string, nombreArchivo: string) {
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
