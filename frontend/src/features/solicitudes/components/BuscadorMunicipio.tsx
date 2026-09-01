import { useMemo, useState } from 'react'
import type { Municipio } from '../types'

const RANGO_MARCAS_DIACRITICAS = String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f)
const DIACRITICOS = new RegExp('[' + RANGO_MARCAS_DIACRITICAS + ']', 'g')

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(DIACRITICOS, '')
    .toLowerCase()
}

interface BuscadorMunicipioProps {
  municipios: Municipio[]
  value: number | undefined
  onChange: (id: number | undefined) => void
  excludeId?: number
  disabled?: boolean
  placeholder?: string
}

export function BuscadorMunicipio({
  municipios,
  value,
  onChange,
  excludeId,
  disabled,
  placeholder,
}: BuscadorMunicipioProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const seleccionado = municipios.find((m) => m.id === value)

  const opciones = useMemo(() => {
    const candidatos = excludeId != null ? municipios.filter((m) => m.id !== excludeId) : municipios
    const q = normalizar(query.trim())
    return q === '' ? candidatos : candidatos.filter((m) => normalizar(m.nombre).includes(q))
  }, [municipios, excludeId, query])

  function seleccionar(m: Municipio) {
    onChange(m.id)
    setQuery('')
    setIsOpen(false)
  }

  function limpiar() {
    onChange(undefined)
    setQuery('')
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (opciones.length > 0) seleccionar(opciones[0])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const valorMostrado = isOpen
    ? query
    : seleccionado
      ? `${seleccionado.nombre} — ${seleccionado.departamentoNombre}`
      : ''

  return (
    <div className="relative">
      <input
        type="text"
        value={valorMostrado}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
          if (value != null) onChange(undefined)
        }}
        onFocus={() => {
          setQuery('')
          setIsOpen(true)
        }}
        onBlur={() => setIsOpen(false)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? 'Escribe para buscar...'}
        disabled={disabled}
        autoComplete="off"
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-marca-medio disabled:bg-gray-50"
      />

      {seleccionado && !isOpen && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={limpiar}
          aria-label="Limpiar selección"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      )}

      {isOpen && !disabled && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {opciones.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400">Sin resultados</li>
          ) : (
            opciones.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => seleccionar(m)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                >
                  {m.nombre} — {m.departamentoNombre}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
