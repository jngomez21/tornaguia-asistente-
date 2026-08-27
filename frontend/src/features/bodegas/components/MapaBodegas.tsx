import { useEffect, useMemo, useRef, useState } from 'react'
import { Map, Marker, Popup, NavigationControl, FullscreenControl, type MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Bodega } from '../types'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

interface MapaBodegasProps {
  bodegas: Bodega[]
  bodegaSeleccionadaId: number | null
  onSeleccionar: (id: number) => void
}

function IconoBodega() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-4 h-4">
      <path d="M3 9l9-5 9 5v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 20v-6h8v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function MapaBodegas({ bodegas, bodegaSeleccionadaId, onSeleccionar }: MapaBodegasProps) {
  const mapRef = useRef<MapRef>(null)
  const [mapCargado, setMapCargado] = useState(false)

  const bodegasConUbicacion = useMemo(
    () => bodegas.filter((b): b is Bodega & { latitud: number; longitud: number } => b.latitud != null && b.longitud != null),
    [bodegas],
  )

  const bounds = useMemo<[[number, number], [number, number]] | null>(() => {
    if (bodegasConUbicacion.length === 0) return null
    const lons = bodegasConUbicacion.map((b) => b.longitud)
    const lats = bodegasConUbicacion.map((b) => b.latitud)
    return [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ]
  }, [bodegasConUbicacion])

  useEffect(() => {
    if (!mapCargado || !bounds) return
    const [min, max] = bounds
    if (min[0] === max[0] && min[1] === max[1]) {
      mapRef.current?.flyTo({ center: min, zoom: 11, duration: 0 })
      return
    }
    mapRef.current?.fitBounds(bounds, { padding: 56, duration: 800 })
    // Solo se ajusta a los límites cuando el mapa termina de cargar, no en cada cambio de bounds
    // (evita reencuadrar todo el mapa cada vez que el usuario selecciona una bodega puntual).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapCargado])

  useEffect(() => {
    if (!mapCargado || bodegaSeleccionadaId == null) return
    const bodega = bodegasConUbicacion.find((b) => b.id === bodegaSeleccionadaId)
    if (!bodega) return
    mapRef.current?.flyTo({ center: [bodega.longitud, bodega.latitud], zoom: 9, duration: 800 })
  }, [mapCargado, bodegaSeleccionadaId, bodegasConUbicacion])

  if (bodegasConUbicacion.length === 0) {
    return (
      <div className="w-full h-72 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-400 mb-6">
        Crea una bodega para verla en el mapa.
      </div>
    )
  }

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-72 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-400 mb-6">
        Mapa no disponible (falta configurar VITE_MAPBOX_TOKEN)
      </div>
    )
  }

  const centro = bounds![0]

  return (
    <div className="relative w-full h-72 rounded-xl overflow-hidden mb-6 border border-gray-100">
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

        {bodegasConUbicacion.map((bodega) => {
          const seleccionada = bodega.id === bodegaSeleccionadaId
          return (
            <Marker key={bodega.id} longitude={bodega.longitud} latitude={bodega.latitud} anchor="bottom">
              <button
                type="button"
                onClick={() => onSeleccionar(bodega.id)}
                title={bodega.nombre}
                className={`flex items-center justify-center rounded-full shadow-md border-2 border-white transition-transform cursor-pointer hover:scale-110 ${
                  seleccionada ? 'w-10 h-10 bg-marca-oscuro' : 'w-8 h-8 bg-marca-medio'
                }`}
              >
                <IconoBodega />
              </button>
            </Marker>
          )
        })}

        {bodegasConUbicacion
          .filter((b) => b.id === bodegaSeleccionadaId)
          .map((bodega) => (
            <Popup
              key={bodega.id}
              longitude={bodega.longitud}
              latitude={bodega.latitud}
              offset={24}
              closeButton
              closeOnClick={false}
              onClose={() => onSeleccionar(bodega.id)}
            >
              <div className="p-1 w-44">
                <p className="text-sm font-semibold text-marca-oscuro">{bodega.nombre}</p>
                <p className="text-xs text-gray-500">
                  {bodega.municipioNombre} — {bodega.departamentoNombre}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {bodega.lotesActivos} lote{bodega.lotesActivos === 1 ? '' : 's'}
                </p>
              </div>
            </Popup>
          ))}
      </Map>
    </div>
  )
}
