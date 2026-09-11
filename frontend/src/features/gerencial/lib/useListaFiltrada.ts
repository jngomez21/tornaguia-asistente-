import { useState } from 'react'

export const LIMITE_TOP = 10

// Sin acentos ni mayúsculas: así "aguila" encuentra "Cerveza Águila" y "bogota" encuentra "Bogotá".
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export type DireccionOrden = 'asc' | 'desc'

/**
 * Recorta a un top 10 por defecto; buscar o pedir "ver todos" destapa el resto sin una segunda
 * llamada al backend, porque las listas de este tablero (contribuyentes, productos, rutas) ya
 * llegan completas y son lo bastante chicas (decenas de filas) para filtrar en el cliente.
 */
export function useListaFiltrada<T>(itemsOrdenados: T[], coincide: (item: T, terminoNormalizado: string) => boolean) {
  const [termino, setTermino] = useState('')
  const [verTodos, setVerTodos] = useState(false)

  const terminoNormalizado = normalizarTexto(termino)
  const buscando = terminoNormalizado.length > 0
  const coincidencias = buscando ? itemsOrdenados.filter((item) => coincide(item, terminoNormalizado)) : itemsOrdenados
  const visibles = buscando || verTodos ? coincidencias : coincidencias.slice(0, LIMITE_TOP)

  return {
    termino,
    setTermino,
    verTodos,
    setVerTodos,
    buscando,
    visibles,
    totalCoincidencias: coincidencias.length,
    totalGeneral: itemsOrdenados.length,
  }
}
