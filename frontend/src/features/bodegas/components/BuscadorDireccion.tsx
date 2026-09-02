import { useEffect, useRef, useState } from 'react'
import { MAPBOX_TOKEN } from '../../../shared/components/mapa/useMapaBase'
import type { DireccionEspecificaValue } from '../schemas'

const DEBOUNCE_MS = 350
const LIMITE_SUGERENCIAS = 5
// Medio lado de la caja de búsqueda alrededor del centro del municipio (~35-40 km). No es el
// límite administrativo real del municipio (no lo tenemos, solo su punto centroide), pero evita
// que aparezcan direcciones de otro departamento como sugerencia.
const MEDIO_LADO_CAJA_GRADOS = 0.35

export interface CentroMunicipio {
  latitud: number
  longitud: number
}

interface SugerenciaMapbox {
  id: string
  place_name: string
  center: [number, number]
}

interface BuscadorDireccionProps {
  value: DireccionEspecificaValue | null | undefined
  onChange: (value: DireccionEspecificaValue | null) => void
  centroMunicipio: CentroMunicipio | null | undefined
  disabled?: boolean
}

function bboxDeCentro(centro: CentroMunicipio): [number, number, number, number] {
  return [
    centro.longitud - MEDIO_LADO_CAJA_GRADOS,
    centro.latitud - MEDIO_LADO_CAJA_GRADOS,
    centro.longitud + MEDIO_LADO_CAJA_GRADOS,
    centro.latitud + MEDIO_LADO_CAJA_GRADOS,
  ]
}

async function buscarDirecciones(
  query: string,
  centro: CentroMunicipio,
  signal: AbortSignal,
): Promise<SugerenciaMapbox[]> {
  const [minLon, minLat, maxLon, maxLat] = bboxDeCentro(centro)
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
    `?access_token=${MAPBOX_TOKEN}&country=co&language=es&limit=${LIMITE_SUGERENCIAS}` +
    `&bbox=${minLon},${minLat},${maxLon},${maxLat}&proximity=${centro.longitud},${centro.latitud}`
  const respuesta = await fetch(url, { signal })
  if (!respuesta.ok) return []
  const data = (await respuesta.json()) as { features?: SugerenciaMapbox[] }
  return data.features ?? []
}

export function BuscadorDireccion({ value, onChange, centroMunicipio, disabled }: BuscadorDireccionProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [resaltado, setResaltado] = useState(0)
  const [sugerencias, setSugerencias] = useState<SugerenciaMapbox[]>([])
  const [buscando, setBuscando] = useState(false)
  const listaRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const texto = query.trim()
    if (texto.length < 3 || !MAPBOX_TOKEN || !centroMunicipio) {
      setSugerencias([])
      return
    }
    const controller = new AbortController()
    setBuscando(true)
    const timeout = setTimeout(() => {
      buscarDirecciones(texto, centroMunicipio, controller.signal)
        .then((features) => setSugerencias(features))
        .catch(() => {})
        .finally(() => setBuscando(false))
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [query, centroMunicipio])

  useEffect(() => {
    setResaltado(0)
  }, [sugerencias])

  useEffect(() => {
    const item = listaRef.current?.children[resaltado] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [resaltado])

  function seleccionar(s: SugerenciaMapbox) {
    onChange({ texto: s.place_name, latitud: s.center[1], longitud: s.center[0] })
    setQuery('')
    setIsOpen(false)
  }

  function limpiar() {
    onChange(null)
    setQuery('')
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (sugerencias.length > 0) setResaltado((i) => Math.min(i + 1, sugerencias.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (sugerencias.length > 0) setResaltado((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const elegida = sugerencias[resaltado]
      if (elegida) seleccionar(elegida)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const valorMostrado = isOpen ? query : (value?.texto ?? '')

  if (!MAPBOX_TOKEN) return null

  return (
    <div className="relative">
      <input
        type="text"
        value={valorMostrado}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
          if (value != null) onChange(null)
        }}
        onFocus={() => {
          setQuery('')
          setIsOpen(true)
        }}
        onBlur={() => setIsOpen(false)}
        onKeyDown={onKeyDown}
        placeholder={centroMunicipio ? 'Escribe una dirección (opcional)...' : 'Selecciona primero un municipio'}
        disabled={disabled || !centroMunicipio}
        autoComplete="off"
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-marca-medio disabled:bg-gray-50"
      />

      {value && !isOpen && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={limpiar}
          aria-label="Quitar dirección"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      )}

      {isOpen && !disabled && centroMunicipio && query.trim().length >= 3 && (
        <ul ref={listaRef} className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {buscando && sugerencias.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400">Buscando...</li>
          ) : sugerencias.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400">Sin resultados</li>
          ) : (
            sugerencias.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setResaltado(i)}
                  onClick={() => seleccionar(s)}
                  className={`w-full text-left px-3 py-2 text-sm ${
                    i === resaltado ? 'bg-marca-medio/10 text-marca-oscuro' : 'hover:bg-gray-50'
                  }`}
                >
                  {s.place_name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
