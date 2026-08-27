import { useEffect, useMemo, useRef, useState } from 'react'
import { Map, Marker, Popup, NavigationControl, FullscreenControl, type MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Bodega } from '../types'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

interface MapaBodegasProps {
  bodegas: Bodega[]
}

export function MapaBodegas({ bodegas }: MapaBodegasProps) {
  const mapRef = useRef<MapRef>(null)
  const [mapCargado, setMapCargado] = useState(false)
  const [bodegaAbiertaId, setBodegaAbiertaId] = useState<number | null>(null)

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
  }, [mapCargado, bounds])

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

        {bodegasConUbicacion.map((bodega) => (
          <Marker key={bodega.id} longitude={bodega.longitud} latitude={bodega.latitud} anchor="bottom">
            <button
              type="button"
              onClick={() => setBodegaAbiertaId((actual) => (actual === bodega.id ? null : bodega.id))}
              title={bodega.nombre}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-md border border-transparent text-lg leading-none transition-transform cursor-pointer hover:scale-110"
            >
              📦
            </button>
          </Marker>
        ))}

        {bodegasConUbicacion
          .filter((b) => b.id === bodegaAbiertaId)
          .map((bodega) => (
            <Popup
              key={bodega.id}
              longitude={bodega.longitud}
              latitude={bodega.latitud}
              offset={20}
              closeButton
              closeOnClick={false}
              onClose={() => setBodegaAbiertaId(null)}
            >
              <div className="p-1 w-40">
                <p className="text-sm font-semibold text-marca-oscuro">{bodega.nombre}</p>
                <p className="text-xs text-gray-500">
                  {bodega.municipioNombre} — {bodega.departamentoNombre}
                </p>
              </div>
            </Popup>
          ))}
      </Map>
    </div>
  )
}
