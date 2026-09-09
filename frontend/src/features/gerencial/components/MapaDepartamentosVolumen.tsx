import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Map, Popup, Source, Layer } from 'react-map-gl/mapbox'
import type { MapMouseEvent } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_TOKEN, useMapaBase } from '../../../shared/components/mapa/useMapaBase'
import { MapaControles, MapaNoDisponible } from '../../../shared/components/mapa/MapaControles'
import { getLimitesDepartamentos } from '../api/gerencialApi'
import { colorSecuencial } from '../lib/colorSecuencial'
import { formatearMonedaCOP } from '../../../shared/lib/formato'
import type { VolumenDepartamento } from '../types'

interface MapaDepartamentosVolumenProps {
  datos: VolumenDepartamento[]
}

const BOUNDS_COLOMBIA: [[number, number], [number, number]] = [
  [-79.1, -4.3],
  [-66.8, 13.4],
]
const COLOR_SIN_GEOMETRIA = '#e5e7eb'

interface PopupDepartamento {
  lon: number
  lat: number
  departamento: VolumenDepartamento
}

/**
 * Coroplético: una sola capa `fill` sobre una expresión `match` indexada por el id del
 * departamento, con el color ya calculado en JS (rampa secuencial normalizada contra el máximo
 * del período) — Mapbox no puede normalizar contra un máximo dinámico dentro de la expresión.
 */
export function MapaDepartamentosVolumen({ datos }: MapaDepartamentosVolumenProps) {
  const { mapRef, mapCargado, onLoad, ajustarABounds } = useMapaBase()
  const [popup, setPopup] = useState<PopupDepartamento | null>(null)

  const ids = useMemo(() => datos.map((d) => d.departamentoId), [datos])

  const limitesQuery = useQuery({
    queryKey: ['gerencial-limites-departamentos', ids],
    queryFn: () => getLimitesDepartamentos(ids),
    enabled: ids.length > 0,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (!mapCargado) return
    ajustarABounds(BOUNDS_COLOMBIA, { duration: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapCargado])

  const maxCantidad = Math.max(0, ...datos.map((d) => d.cantidad))

  const geojson = useMemo(() => {
    const features = (limitesQuery.data ?? []).map((limite) => ({
      type: 'Feature' as const,
      properties: { id: limite.id },
      geometry: { type: 'MultiPolygon' as const, coordinates: limite.poligonos },
    }))
    return { type: 'FeatureCollection' as const, features }
  }, [limitesQuery.data])

  const expresionColor = useMemo(() => {
    const casos: (string | number)[] = []
    for (const d of datos) {
      const t = maxCantidad > 0 ? d.cantidad / maxCantidad : 0
      casos.push(d.departamentoId, colorSecuencial(t))
    }
    // Cast: las expresiones de Mapbox GL no tienen un tipo preciso en mapbox-gl-js para TS.
    return ['match', ['get', 'id'], ...casos, COLOR_SIN_GEOMETRIA] as unknown as string
  }, [datos, maxCantidad])

  if (!MAPBOX_TOKEN) return <MapaNoDisponible />

  function handleClick(e: MapMouseEvent) {
    const feature = e.features?.[0]
    const id = feature?.properties?.id as number | undefined
    const departamento = id != null ? datos.find((d) => d.departamentoId === id) : undefined
    if (!departamento) return
    setPopup({ lon: e.lngLat.lng, lat: e.lngLat.lat, departamento })
  }

  return (
    <div className="relative w-full h-96 rounded-xl overflow-hidden border border-gray-100">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: -74.3, latitude: 4.5, zoom: 4.4 }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        scrollZoom={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
        onLoad={onLoad}
        interactiveLayerIds={geojson.features.length > 0 ? ['gerencial-departamentos-relleno'] : []}
        onClick={handleClick}
      >
        <MapaControles />

        {geojson.features.length > 0 && (
          <Source id="gerencial-departamentos" type="geojson" data={geojson}>
            <Layer
              id="gerencial-departamentos-relleno"
              type="fill"
              paint={{ 'fill-color': expresionColor, 'fill-opacity': 0.85 }}
            />
            <Layer id="gerencial-departamentos-borde" type="line" paint={{ 'line-color': '#ffffff', 'line-width': 1 }} />
          </Source>
        )}

        {popup && (
          <Popup longitude={popup.lon} latitude={popup.lat} closeButton closeOnClick={false} onClose={() => setPopup(null)}>
            <div className="p-1 min-w-[160px]">
              <p className="font-semibold text-marca-oscuro text-sm mb-1">{popup.departamento.nombre}</p>
              <p className="text-xs text-gray-600">{popup.departamento.cantidad.toLocaleString('es-CO')} tornaguías</p>
              <p className="text-xs text-gray-600">{formatearMonedaCOP(popup.departamento.impuesto)}</p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
