import { useEffect, useMemo, useRef, useState } from 'react'
import { Map, Marker, Popup, Source, Layer, NavigationControl, FullscreenControl, type MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { EstadoTornaguiaPdf } from './ResultadoSolicitud'
import { colorPorTipo, colorHexPorTipo } from '../lib/coloresTornaguia'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
const DURACION_ANIMACION_MS = 1800
const PALETA_RUTAS = ['#1E88C7', '#2FA84F', '#C2410C', '#7C3AED', '#DB2777', '#0B1F4B']

export interface RutaMapa {
  solicitudId: number
  geometria: [number, number][]
  tipoTornaguia: string
  justificacion: string
  estadoPdf: EstadoTornaguiaPdf
  onSolicitarTornaguia?: () => void
  onDescargarPdf?: () => void
}

interface MapaRutasTornaguiasProps {
  rutas: RutaMapa[]
  animar?: boolean
  rutaEnFocoId?: number | null
  onSalirFoco?: () => void
}

function interpolarEnRuta(geometria: [number, number][], t: number): [number, number] {
  if (geometria.length === 0) return [0, 0]
  if (geometria.length === 1 || t <= 0) return geometria[0]
  if (t >= 1) return geometria[geometria.length - 1]

  const distancias = [0]
  for (let i = 1; i < geometria.length; i++) {
    const [x0, y0] = geometria[i - 1]
    const [x1, y1] = geometria[i]
    distancias.push(distancias[i - 1] + Math.hypot(x1 - x0, y1 - y0))
  }

  const objetivo = distancias[distancias.length - 1] * t

  let i = 1
  while (i < distancias.length && distancias[i] < objetivo) i++
  const previa = distancias[i - 1]
  const segmento = distancias[i] - previa || 1
  const fraccion = (objetivo - previa) / segmento

  const [x0, y0] = geometria[i - 1]
  const [x1, y1] = geometria[i]
  return [x0 + (x1 - x0) * fraccion, y0 + (y1 - y0) * fraccion]
}

function useProgresoAnimacion(activa: boolean): number {
  const [progreso, setProgreso] = useState(activa ? 0 : 1)

  useEffect(() => {
    if (!activa) return
    setProgreso(0)
    let inicio: number | null = null
    let frame: number

    function tick(timestamp: number) {
      if (inicio === null) inicio = timestamp
      const t = Math.min((timestamp - inicio) / DURACION_ANIMACION_MS, 1)
      setProgreso(t)
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [activa])

  return progreso
}

function RutaEnMapa({ ruta, animar, color }: { ruta: RutaMapa; animar: boolean; color: string }) {
  const claseColor = colorPorTipo[ruta.tipoTornaguia] ?? 'bg-marca-oscuro'
  const origen = ruta.geometria[0]
  const destino = ruta.geometria[ruta.geometria.length - 1]
  const listoParaDescargar = ruta.estadoPdf === 'generado'

  const progreso = useProgresoAnimacion(animar)
  const animacionTerminada = !animar || progreso >= 1
  const posicionActual = animar ? interpolarEnRuta(ruta.geometria, progreso) : destino

  const [popupAbierto, setPopupAbierto] = useState(false)

  const lineaRuta = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates: ruta.geometria },
    }),
    [ruta.geometria],
  )

  return (
    <>
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

      {!animacionTerminada && (
        <Marker longitude={posicionActual[0]} latitude={posicionActual[1]} anchor="center">
          <div className="w-3.5 h-3.5 rounded-full shadow-md" style={{ backgroundColor: color }} />
        </Marker>
      )}

      {animacionTerminada && (
        <Marker longitude={destino[0]} latitude={destino[1]} anchor="center">
          <button
            type="button"
            onClick={() => setPopupAbierto((abierto) => !abierto)}
            title="Ver detalles de la tornaguía"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-md border border-transparent text-lg leading-none animate-pop-in transition-transform cursor-pointer hover:scale-110"
          >
            📄
          </button>
        </Marker>
      )}

      {animacionTerminada && popupAbierto && (
        <Popup
          longitude={destino[0]}
          latitude={destino[1]}
          offset={20}
          closeButton
          closeOnClick={false}
          onClose={() => setPopupAbierto(false)}
        >
          <div className="p-1 w-48">
            <span
              className={`inline-block ${claseColor} text-white text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1.5`}
            >
              {ruta.tipoTornaguia}
            </span>
            <p className="text-xs text-gray-700 mb-2">{ruta.justificacion}</p>
            {listoParaDescargar ? (
              <button
                type="button"
                onClick={ruta.onDescargarPdf}
                className="w-full bg-marca-oscuro text-white text-xs font-semibold py-1.5 rounded-md hover:opacity-90 transition"
              >
                Descargar PDF
              </button>
            ) : (
              <button
                type="button"
                onClick={ruta.onSolicitarTornaguia}
                className="w-full bg-marca-medio text-white text-xs font-semibold py-1.5 rounded-md hover:opacity-90 transition"
              >
                Generar tornaguía
              </button>
            )}
          </div>
        </Popup>
      )}
    </>
  )
}

export function MapaRutasTornaguias({ rutas, animar = false, rutaEnFocoId = null, onSalirFoco }: MapaRutasTornaguiasProps) {
  const mapRef = useRef<MapRef>(null)
  const [mapCargado, setMapCargado] = useState(false)

  const rutaEnFoco = rutaEnFocoId != null ? rutas.find((r) => r.solicitudId === rutaEnFocoId) : undefined
  const enFoco = rutaEnFoco !== undefined
  const rutasVisibles = rutaEnFoco ? [rutaEnFoco] : rutas

  const bounds = useMemo<[[number, number], [number, number]]>(() => {
    const puntos = rutasVisibles.flatMap((r) => r.geometria)
    const lons = puntos.map((p) => p[0])
    const lats = puntos.map((p) => p[1])
    return [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ]
  }, [rutasVisibles])

  useEffect(() => {
    if (!mapCargado) return
    mapRef.current?.fitBounds(bounds, { padding: 56, duration: 800 })
  }, [mapCargado, bounds])

  if (rutas.length === 0) return null

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-80 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-400 mb-6">
        Mapa no disponible (falta configurar VITE_MAPBOX_TOKEN)
      </div>
    )
  }

  const centro: [number, number] = [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2]
  const animarRutas = (animar && rutas.length === 1) || enFoco

  return (
    <div className="relative w-full h-80 rounded-xl overflow-hidden mb-6 border border-gray-100">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: centro[0], latitude: centro[1], zoom: 5 }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        scrollZoom={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
        onLoad={() => setMapCargado(true)}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <FullscreenControl position="top-right" />

        {rutasVisibles.map((ruta) => (
          <RutaEnMapa
            key={ruta.solicitudId}
            ruta={ruta}
            animar={animarRutas}
            color={
              rutasVisibles.length > 1
                ? PALETA_RUTAS[rutas.findIndex((r) => r.solicitudId === ruta.solicitudId) % PALETA_RUTAS.length]
                : (colorHexPorTipo[ruta.tipoTornaguia] ?? '#0B1F4B')
            }
          />
        ))}
      </Map>

      {enFoco && onSalirFoco && (
        <button
          type="button"
          onClick={onSalirFoco}
          className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white shadow-md border border-gray-200 text-xs font-semibold text-marca-oscuro px-3 py-2 rounded-lg hover:bg-gray-50 transition"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Ver todas las rutas
        </button>
      )}
    </div>
  )
}
