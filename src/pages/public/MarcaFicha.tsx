import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alerta, LinkButton, Spinner } from '../../components/ui'
import { pesos } from '../../lib/format'
import { linkInstagram, linkWeb, pedirWa } from '../../lib/marcas'
import { supabase, urlPublica } from '../../lib/supabase'
import { COLS_MARCA_PUBLICA, type Marca, type Producto } from '../../lib/types'

export default function MarcaFicha() {
  const { slug = '' } = useParams()
  const [m, setM] = useState<Marca | null | undefined>(undefined)
  const [prods, setProds] = useState<Producto[]>([])

  useEffect(() => {
    supabase.from('marcas').select(COLS_MARCA_PUBLICA).eq('slug', slug).maybeSingle().then(async ({ data }) => {
      const marca = data as unknown as Marca | null
      setM(marca)
      if (marca) {
        const { data: p } = await supabase.from('productos').select('*').eq('marca_id', marca.id).eq('activo', true).order('orden')
        setProds((p as Producto[]) ?? [])
      }
    })
  }, [slug])

  if (m === undefined) return <Spinner />
  if (m === null) return <Alerta tipo="error">No encontramos esta marca.</Alerta>
  const wa = pedirWa(m.whatsapp, m.nombre), ig = linkInstagram(m.instagram), web = linkWeb(m.web)

  const disp = (p: Producto) => [p.disp_previa && 'Antes', p.disp_festival && 'En el festival', p.disp_post && 'Después'].filter(Boolean).join(' · ')

  return (
    <div className="space-y-6">
      <Link to="/marcas" className="font-bold underline">← Todas las marcas</Link>
      <header className="flex items-center gap-4">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-superficie ring-1 ring-secundario">
          {m.logo_path ? <img src={urlPublica('marcas', m.logo_path)} alt={`Logo de ${m.nombre}`} className="h-full w-full object-cover" />
            : <span className="font-display text-5xl font-bold text-amor">{m.nombre.slice(0, 1)}</span>}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{m.nombre}</h1>
          {m.rubro && <p className="font-bold text-amor">{m.rubro}</p>}
        </div>
      </header>
      {m.descripcion && <p className="text-lg">{m.descripcion}</p>}
      <div className="flex flex-wrap gap-2">
        {wa && <LinkButton to={wa}>Pedir por WhatsApp</LinkButton>}
        {ig && <LinkButton to={ig} variante="suave">Instagram</LinkButton>}
        {web && <LinkButton to={web} variante="borde">Web</LinkButton>}
      </div>
      {prods.length > 0 && (
        <section>
          <h2 className="mb-3 text-2xl font-bold">Productos</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {prods.map((p) => (
              <li key={p.id} className="flex gap-3 rounded-3xl bg-superficie p-3 ring-1 ring-secundario/60">
                {p.foto_path && <img src={urlPublica('productos', p.foto_path)} alt={p.nombre} className="size-24 shrink-0 rounded-2xl object-cover" loading="lazy" />}
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{p.nombre}</p>
                  {p.descripcion && <p className="text-sm text-bosque/80">{p.descripcion}</p>}
                  <p className="mt-1 font-bold">{p.precio != null ? pesos(p.precio) : 'Consultar precio'}</p>
                  <p className="text-xs text-bosque/70">{disp(p)}</p>
                  {m.whatsapp && <a href={pedirWa(m.whatsapp, m.nombre, p.nombre)!} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-bold underline">Pedir este</a>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
