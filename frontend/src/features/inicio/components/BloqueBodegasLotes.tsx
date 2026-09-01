import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getBodegas } from '../../bodegas/api/bodegasApi'

const INTERVALO_MS = 5000

interface BloqueBodegasLotesProps {
  delayMs: number
}

export function BloqueBodegasLotes({ delayMs }: BloqueBodegasLotesProps) {
  const navigate = useNavigate()
  const bodegasQuery = useQuery({ queryKey: ['bodegas'], queryFn: getBodegas })
  const bodegas = bodegasQuery.data ?? []

  const [indice, setIndice] = useState(0)
  const [enPausa, setEnPausa] = useState(false)
  const indiceSeguro = indice < bodegas.length ? indice : 0

  useEffect(() => {
    if (bodegas.length < 2 || enPausa) return
    const id = setInterval(() => {
      setIndice((actual) => (actual + 1) % bodegas.length)
    }, INTERVALO_MS)
    return () => clearInterval(id)
  }, [bodegas.length, enPausa])

  if (bodegasQuery.isLoading) return null

  return (
    <div
      style={{ animationDelay: `${delayMs}ms` }}
      className="animate-fade-slide-up bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-10"
      onMouseEnter={() => setEnPausa(true)}
      onMouseLeave={() => setEnPausa(false)}
    >
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Bodegas y lotes</p>

      {bodegas.length === 0 ? (
        <div className="text-center py-2">
          <p className="text-sm text-gray-500 mb-3">Aún no tienes bodegas registradas.</p>
          <button
            type="button"
            onClick={() => navigate('/bodegas')}
            className="text-sm font-semibold text-marca-medio hover:underline"
          >
            Crear tu primera bodega
          </button>
        </div>
      ) : (
        <>
          <div key={bodegas[indiceSeguro].id} className="animate-fade-slide-up flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold text-marca-oscuro truncate">{bodegas[indiceSeguro].nombre}</p>
              <p className="text-sm text-gray-500 truncate">
                {bodegas[indiceSeguro].municipioNombre}, {bodegas[indiceSeguro].departamentoNombre} —{' '}
                {bodegas[indiceSeguro].lotesActivos} lote{bodegas[indiceSeguro].lotesActivos === 1 ? '' : 's'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/bodegas?bodegaId=${bodegas[indiceSeguro].id}`)}
              className="shrink-0 text-sm font-semibold text-marca-medio hover:underline"
            >
              Ver bodega →
            </button>
          </div>

          {bodegas.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-5">
              {bodegas.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setIndice(i)}
                  aria-label={`Ver ${b.nombre}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === indiceSeguro ? 'w-5 bg-marca-oscuro' : 'w-1.5 bg-gray-200'
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
