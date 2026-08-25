export type TipoTornaguia = 'Movilización' | 'Reenvío' | 'Tránsito'

export const explicacionPorTipo: Record<TipoTornaguia, string> = {
  Movilización: 'Va hacia otro departamento y el producto aún no ha sido declarado en el origen.',
  Reenvío: 'Va hacia otro departamento y el producto ya fue declarado en el origen.',
  Tránsito: 'Se queda en el mismo departamento, o el destino es otro país / es para exportación.',
}
