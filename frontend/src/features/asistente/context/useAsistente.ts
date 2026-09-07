import { useContext } from 'react'
import { AsistenteContext } from './asistenteContextDef'

export function useAsistente() {
  const context = useContext(AsistenteContext)
  if (!context) throw new Error('useAsistente debe usarse dentro de AsistenteProvider')
  return context
}
