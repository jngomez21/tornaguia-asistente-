import { Fragment, useMemo, useRef } from 'react'
import { Map, Marker, Source, Layer, type MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { EstadoTornaguiaPdf } from './ResultadoSolicitud'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

const colorHexPorTipo: Record<string, string> = {
  Movilización: '#1E88C7',
  Reenvío: '#2FA84F',
  Tránsito: '#0B1F4B',
}

export interface RutaMapa {
  solicitudId: number
  geometria: [number, number][]
  tipoTornaguia: string
  estadoPdf: EstadoTornaguiaPdf
  onDescargarPdf?: () => void
}

interface MapaRutasTornaguiasProps {
  rutas: RutaMapa[]
}

export function MapaRutasTornaguias({ rutas }: MapaRutasTornaguiasProps) {
  const mapRef = useRef<MapRef>(null)

  const bounds = useMemo<[[number, number], [number, number]]>(() => {
    const puntos = rutas.flatMap((r) => r.geometria)
    const lons = puntos.map((p) => p[0])
    const lats = puntos.map((p) => p[1])
    return [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ]
  }, [rutas])

  if (rutas.length === 0) return null

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-80 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-400 mb-6">
        Mapa no disponible (falta configurar VITE_MAPBOX_TOKEN)
      </div>
    )
  }

  const centro: [number, number] = [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2]

  return (
    <div className="w-full h-80 rounded-xl overflow-hidden mb-6 border border-gray-100">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: centro[0], latitude: centro[1], zoom: 5 }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        scrollZoom={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
        onLoad={(e) => e.target.fitBounds(bounds, { padding: 56, duration: 800 })}
      >
        {rutas.map((ruta) => {
          const color = colorHexPorTipo[ruta.tipoTornaguia] ?? '#0B1F4B'
          const listoParaDescargar = ruta.estadoPdf === 'generado'
          const origen = ruta.geometria[0]
          const destino = ruta.geometria[ruta.geometria.length - 1]
          const lineaRuta = {
            type: 'Feature' as const,
            properties: {},
            geometry: { type: 'LineString' as const, coordinates: ruta.geometria },
          }

          return (
            <Fragment key={ruta.solicitudId}>
              <Source id={`ruta-${ruta.solicitudId}`} type="geojson" data={lineaRuta}>
                <Layer
                  id={`ruta-${ruta.solicitudId}-linea`}
                  type="line"
                  layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                  paint={{ 'line-color': color, 'line-width': 4, 'line-opacity': 0.9 }}
                />
              </Source>

              <Marker longitude={origen[0]} latitude={origen[1]} anchor="center">
                <div className="w-3 h-3 rounded-full bg-white shadow" style={{ border: `2px solid ${color}` }} />
              </Marker>

              <Marker longitude={destino[0]} latitude={destino[1]} anchor="center">
                <button
                  type="button"
                  key={ruta.estadoPdf}
                  onClick={listoParaDescargar ? ruta.onDescargarPdf : undefined}
                  disabled={!listoParaDescargar}
                  title={listoParaDescargar ? 'Descargar tornaguía' : 'La tornaguía aún no está generada'}
                  className={`flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-md border text-lg leading-none animate-pop-in transition-transform ${
                    listoParaDescargar
                      ? 'border-transparent cursor-pointer hover:scale-110'
                      : 'border-gray-300 grayscale cursor-not-allowed'
                  }`}
                >
                  📄
                </button>
              </Marker>
            </Fragment>
          )
        })}
      </Map>
    </div>
  )
}
