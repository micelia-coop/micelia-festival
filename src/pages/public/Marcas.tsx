import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Spinner, Titulo } from '../../components/ui'
import { supabase, urlPublica } from '../../lib/supabase'
import { COLS_MARCA_PUBLICA, type Marca } from '../../lib/types'

export default function Marcas() {
  const [marcas, setMarcas] = useState<Marca[] | null>(null)
  const [rubro, setRubro] = useState('')

  useEffect(() => {
    supabase.from('marcas').select(COLS_MARCA_PUBLICA).eq('en_guia_regalos', true).order('orden').order('nombre')
      .then(({ data }) => setMarcas((data as unknown as Marca[]) ?? []))
  }, [])

  const rubros = useMemo(() => [...new Set((marcas ?? []).map((m) => m.rubro).filter(Boolean))] as string[], [marcas])
  const visibles = (marcas ?? []).filter((m) => !rubro || m.rubro === rubro)

  return (
    <div>
      <Titulo acento="var(--color-amor)" bajada="Regalos conscientes de marcas emprendedoras. Pedí directo a cada marca por WhatsApp.">
        Guía de regalos
      </Titulo>
      {!marcas ? <Spinner /> : (
        <>
          {rubros.length > 1 && (
            <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filtrar por rubro">
              {['', ...rubros].map((r) => (
                <button key={r || 'todas'} onClick={() => setRubro(r)} aria-pressed={rubro === r}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${rubro === r ? 'bg-amor text-white' : 'bg-secundario/60'}`}>
                  {r || 'Todas'}
                </button>
              ))}
            </div>
          )}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {visibles.map((m) => (
              <li key={m.id}>
                <Link to={`/marcas/${m.slug}`} className="block h-full rounded-3xl bg-superficie p-3 shadow-sm ring-1 ring-secundario/60">
                  <div className="mb-2 flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-fondo">
                    {m.logo_path
                      ? <img src={urlPublica('marcas', m.logo_path)} alt={`Logo de ${m.nombre}`} className="h-full w-full object-cover" loading="lazy" />
                      : <span className="font-display text-4xl font-bold text-amor">{m.nombre.slice(0, 1)}</span>}
                  </div>
                  <p className="font-bold leading-tight">{m.nombre}</p>
                  {m.rubro && <p className="text-sm text-bosque/70">{m.rubro}</p>}
                </Link>
              </li>
            ))}
          </ul>
          {!visibles.length && <p className="py-8 text-center">Muy pronto vas a ver acá las marcas del festival.</p>}
        </>
      )}
    </div>
  )
}
