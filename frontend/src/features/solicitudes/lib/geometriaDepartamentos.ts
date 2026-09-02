import type { Feature, MultiPolygon } from 'geojson'

/** Ray casting sobre un solo anillo. `true` si el punto está dentro del polígono que forma el anillo. */
function puntoEnAnillo([x, y]: [number, number], anillo: number[][]): boolean {
  let dentro = false
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const [xi, yi] = anillo[i]
    const [xj, yj] = anillo[j]
    const cruza = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (cruza) dentro = !dentro
  }
  return dentro
}

/** El primer anillo de un polígono es el borde exterior; el resto son huecos que se restan. */
function puntoEnPoligono(punto: [number, number], poligono: number[][][]): boolean {
  if (!puntoEnAnillo(punto, poligono[0])) return false
  return poligono.slice(1).every((hueco) => !puntoEnAnillo(punto, hueco))
}

export function puntoEnMultiPoligono(punto: [number, number], poligonos: number[][][][]): boolean {
  return poligonos.some((poligono) => puntoEnPoligono(punto, poligono))
}

export function multiPoligonoAGeoJson(poligonos: number[][][][]): Feature<MultiPolygon> {
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'MultiPolygon', coordinates: poligonos },
  }
}
