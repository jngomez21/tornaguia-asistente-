// Rampa secuencial de un solo tono (claro -> oscuro), construida entre los dos azules de marca
// que ya existen en la app: nunca introduce un color nuevo al sistema.
const INICIO: [number, number, number] = [234, 244, 251] // tinte muy claro de marca-medio (#1E88C7)
const FIN: [number, number, number] = [11, 31, 75] // marca-oscuro (#0B1F4B)

export function colorSecuencial(t: number): string {
  const claro = Math.max(0, Math.min(1, t))
  const [r0, g0, b0] = INICIO
  const [r1, g1, b1] = FIN
  const r = Math.round(r0 + (r1 - r0) * claro)
  const g = Math.round(g0 + (g1 - g0) * claro)
  const b = Math.round(b0 + (b1 - b0) * claro)
  return `rgb(${r}, ${g}, ${b})`
}
