import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { crearProducto } from '../api/solicitudesApi'
import type { Producto } from '../types'

const LIMITE_RESULTADOS = 5

interface BuscadorProductoProps {
  productos: Producto[]
  value: number | undefined
  nombreSeleccionado: string
  onChange: (id: number | undefined, nombre: string) => void
  disabled?: boolean
  disponiblePorProducto?: Record<number, number>
}

export function BuscadorProducto({
  productos,
  value,
  nombreSeleccionado,
  onChange,
  disabled,
  disponiblePorProducto,
}: BuscadorProductoProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const crearMutation = useMutation({
    mutationFn: crearProducto,
    onSuccess: (producto) => {
      queryClient.setQueryData<Producto[]>(['productos'], (actual) => {
        if (!actual) return [producto]
        if (actual.some((p) => p.id === producto.id)) return actual
        return [...actual, producto].sort((a, b) => a.nombre.localeCompare(b.nombre))
      })
      onChange(producto.id, producto.nombre)
      setQuery('')
      setIsOpen(false)
    },
  })

  const opciones = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtrados = q === '' ? productos : productos.filter((p) => p.nombre.toLowerCase().includes(q))
    return filtrados.slice(0, LIMITE_RESULTADOS)
  }, [productos, query])

  const coincideExacto = productos.some((p) => p.nombre.toLowerCase() === query.trim().toLowerCase())

  function seleccionar(p: Producto) {
    onChange(p.id, p.nombre)
    setQuery('')
    setIsOpen(false)
  }

  const valorMostrado = isOpen ? query : nombreSeleccionado

  return (
    <div className="relative">
      <input
        type="text"
        value={valorMostrado}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
          if (value != null) onChange(undefined, '')
        }}
        onFocus={() => {
          setQuery('')
          setIsOpen(true)
        }}
        onBlur={() => setIsOpen(false)}
        placeholder="Busca o crea un producto"
        disabled={disabled}
        autoComplete="off"
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-marca-medio disabled:bg-gray-50"
      />

      {isOpen && !disabled && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {opciones.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => seleccionar(p)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              >
                {p.nombre}
                {disponiblePorProducto && (
                  <span className="text-gray-400"> — disponible: {disponiblePorProducto[p.id] ?? 0}</span>
                )}
              </button>
            </li>
          ))}

          {query.trim() !== '' && !coincideExacto && (
            <li>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => crearMutation.mutate(query.trim())}
                disabled={crearMutation.isPending}
                className="w-full text-left px-3 py-2 text-sm text-marca-medio hover:bg-marca-medio/5 disabled:opacity-50"
              >
                {crearMutation.isPending ? 'Creando...' : `+ Crear "${query.trim()}"`}
              </button>
            </li>
          )}

          {opciones.length === 0 && query.trim() === '' && (
            <li className="px-3 py-2 text-sm text-gray-400">Escribe para buscar o crear un producto</li>
          )}
        </ul>
      )}
    </div>
  )
}
