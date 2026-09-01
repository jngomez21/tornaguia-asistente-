import { useCallback, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl/mapbox'

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

export type BoundsMapa = [[number, number], [number, number]]

/** Estado y utilidades comunes a todos los mapas de Mapbox de la app (ref, carga, encuadre). */
export function useMapaBase() {
  const mapRef = useRef<MapRef>(null)
  const [mapCargado, setMapCargado] = useState(false)

  const ajustarABounds = useCallback((bounds: BoundsMapa, opciones?: { padding?: number; duration?: number }) => {
    const [min, max] = bounds
    if (min[0] === max[0] && min[1] === max[1]) {
      mapRef.current?.flyTo({ center: min, zoom: 11, duration: 0 })
      return
    }
    mapRef.current?.fitBounds(bounds, {
      padding: opciones?.padding ?? 56,
      duration: opciones?.duration ?? 800,
    })
  }, [])

  return { mapRef, mapCargado, onLoad: () => setMapCargado(true), ajustarABounds }
}
