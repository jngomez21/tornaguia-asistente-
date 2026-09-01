import { NavigationControl, FullscreenControl } from 'react-map-gl/mapbox'

/** Controles estándar (zoom/brújula y pantalla completa) compartidos por todos los mapas. */
export function MapaControles() {
  return (
    <>
      <NavigationControl position="top-right" showCompass={false} />
      <FullscreenControl position="top-right" />
    </>
  )
}

export function MapaNoDisponible() {
  return (
    <div className="w-full h-80 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-400 mb-6">
      Mapa no disponible (falta configurar VITE_MAPBOX_TOKEN)
    </div>
  )
}
