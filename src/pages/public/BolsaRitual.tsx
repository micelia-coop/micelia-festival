import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { DatosComprador, irAMercadoPago, MetodoPago, type Metodo } from '../../components/Checkout'
import { Alerta, Button, Card, Field, Input, Spinner, Textarea, Titulo } from '../../components/ui'
import { useConfig } from '../../lib/config'
import { pesos } from '../../lib/format'
import { rpc, supabase, urlPublica } from '../../lib/supabase'

const BAJADA_BOLSA = 'Esta delicada bolsita brujil la hemos armado con mucho cuidado y amor. Pensada para que sea un sentido presente, que te autoregales o entregues a alguien más.'

type Bolsa = { id: string; nombre: string; descripcion: string | null; precio_base: number; foto_path: string | null }
type Base = { bolsa_id: string; cantidad: number; productos: { nombre: string; descripcion: string | null; marcas: { nombre: string } | null } | null }
type Extra = { id: string; nombre: string; descripcion: string | null; precio: number; foto_path: string | null; marcas: { nombre: string } | null }

export default function BolsaRitual() {
  const { config } = useConfig()
  const nav = useNavigate()
  const [bolsas, setBolsas] = useState<Bolsa[] | null>(null)
  const [base, setBase] = useState<Base[]>([])
  const [extras, setExtras] = useState<Extra[]>([])
  const [sel, setSel] = useState('')
  const [cantBolsa, setCantBolsa] = useState(1)
  const [cantExtra, setCantExtra] = useState<Record<string, number>>({})
  const [regalo, setRegalo] = useState(false)
  const [entrega, setEntrega] = useState<'retiro_petruca' | 'retiro_festival'>('retiro_petruca')
  const [metodo, setMetodo] = useState<Metodo>('transferencia')
  const conMP = config.ventas.mercadopago === true
  useEffect(() => { if (conMP) setMetodo('mercadopago') }, [conMP])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const abiertas = config.ventas.bolsas_abiertas === true

  useEffect(() => {
    Promise.all([
      supabase.from('bolsas').select('id,nombre,descripcion,precio_base,foto_path').eq('activo', true).order('orden'),
      supabase.from('bolsa_items_base').select('bolsa_id,cantidad,productos(nombre,descripcion,marcas(nombre))'),
      supabase.from('productos').select('id,nombre,descripcion,precio,foto_path,marcas(nombre)')
        .eq('agregable_a_bolsa', true).eq('activo', true).not('precio', 'is', null).order('orden'),
    ]).then(([b, bi, ex]) => {
      const lista = (b.data as Bolsa[]) ?? []
      setBolsas(lista); setSel(lista[0]?.id ?? '')
      setBase((bi.data as unknown as Base[]) ?? [])
      setExtras((ex.data as unknown as Extra[]) ?? [])
    })
  }, [])

  if (!bolsas) return <Spinner />
  const bolsa = bolsas.find((b) => b.id === sel)
  if (!bolsa) return <Alerta>La Bolsa Ritual llega muy pronto.</Alerta>

  const totalExtras = extras.reduce((s, e) => s + (cantExtra[e.id] ?? 0) * e.precio, 0)
  const total = cantBolsa * bolsa.precio_base + totalExtras
  const setExtra = (id: string, d: number) => setCantExtra((c) => ({ ...c, [id]: Math.max(0, Math.min(20, (c[id] ?? 0) + d)) }))

  async function comprar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setEnviando(true); setError('')
    try {
      const r = await rpc<{ token: string }>('crear_pedido_bolsa', {
        p_nombre: f.get('nombre'), p_email: f.get('email'), p_whatsapp: f.get('whatsapp'), p_metodo: metodo,
        p_bolsa_id: bolsa!.id, p_cantidad: cantBolsa,
        p_extras: Object.entries(cantExtra).filter(([, n]) => n > 0).map(([producto_id, cantidad]) => ({ producto_id, cantidad })),
        p_es_regalo: regalo, p_regalo_para: f.get('regalo_para'), p_regalo_mensaje: f.get('regalo_mensaje'), p_entrega: entrega,
        p_instagram: f.get('instagram'),
      })
      if (metodo === 'mercadopago') {
        const err = await irAMercadoPago(r.token)
        if (err) nav(`/p/${r.token}`)
        return
      }
      nav(`/p/${r.token}`)
    } catch (err) { setError((err as Error).message); setEnviando(false) }
  }

  const Stepper = ({ v, onMenos, onMas, label }: { v: number; onMenos: () => void; onMas: () => void; label: string }) => (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <Button type="button" variante="borde" className="size-10 !p-0 text-xl" onClick={onMenos} aria-label="Quitar">−</Button>
      <span className="w-6 text-center text-lg font-bold">{v}</span>
      <Button type="button" variante="borde" className="size-10 !p-0 text-xl" onClick={onMas} aria-label="Agregar">+</Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <Titulo acento="var(--color-amor)" bajada={config.bolsa.bajada ?? BAJADA_BOLSA}>{config.bolsa.titulo ?? 'Bolsa Ritual'}</Titulo>

      {bolsas.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {bolsas.map((b) => (
            <button key={b.id} onClick={() => setSel(b.id)} aria-pressed={sel === b.id}
              className={`rounded-full px-4 py-2 font-bold ${sel === b.id ? 'bg-amor text-white' : 'bg-secundario/60'}`}>{b.nombre}</button>
          ))}
        </div>
      )}

      <form onSubmit={comprar} className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <Card acento="var(--color-amor)">
            {bolsa.foto_path && <img src={urlPublica('festival', bolsa.foto_path)} alt={bolsa.nombre} className="mb-4 aspect-[4/3] w-full rounded-2xl object-cover" />}
            <h2 className="text-2xl font-bold">{bolsa.nombre}</h2>
            <p className="font-display text-3xl font-bold">{pesos(bolsa.precio_base)}</p>
            {bolsa.descripcion && <p className="mt-2 text-bosque/80">{bolsa.descripcion}</p>}
            <h3 className="mt-4 font-bold">Incluye</h3>
            <ul className="mt-1 space-y-1">
              {base.filter((b) => b.bolsa_id === bolsa.id).map((b, i) => (
                <li key={i}>🌿 {b.cantidad > 1 ? `${b.cantidad} × ` : ''}{b.productos?.nombre}{b.productos?.marcas ? <span className="text-bosque/70"> · {b.productos.marcas.nombre}</span> : null}</li>
              ))}
            </ul>
            {abiertas && <div className="mt-4 flex items-center justify-between"><span className="font-bold">Cantidad de bolsas</span>
              <Stepper v={cantBolsa} label="Cantidad de bolsas" onMenos={() => setCantBolsa(Math.max(1, cantBolsa - 1))} onMas={() => setCantBolsa(Math.min(10, cantBolsa + 1))} /></div>}
          </Card>

          {extras.length > 0 && (
            <section>
              <h2 className="mb-1 text-2xl font-bold">Sumale extras</h2>
              <p className="mb-3 text-bosque/80">Productos de otras marcas para hacerla más tuya.</p>
              <ul className="space-y-2">
                {extras.map((x) => (
                  <li key={x.id} className="flex items-center gap-3 rounded-3xl bg-superficie p-3 ring-1 ring-secundario/60">
                    {x.foto_path && <img src={urlPublica('productos', x.foto_path)} alt={x.nombre} className="size-16 shrink-0 rounded-2xl object-cover" loading="lazy" />}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold leading-tight">{x.nombre}</p>
                      <p className="text-sm text-bosque/70">{x.marcas?.nombre} · <strong className="text-bosque">{pesos(x.precio)}</strong></p>
                    </div>
                    {abiertas && <Stepper v={cantExtra[x.id] ?? 0} label={`Cantidad de ${x.nombre}`} onMenos={() => setExtra(x.id, -1)} onMas={() => setExtra(x.id, 1)} />}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {abiertas && (
          <Card className="h-fit space-y-4 md:sticky md:top-24">
            <label className="flex items-center gap-3 rounded-2xl bg-amor/10 p-3 font-bold">
              <input type="checkbox" checked={regalo} onChange={(e) => setRegalo(e.target.checked)} className="size-5 accent-amor" />
              🎁 Es para regalar
            </label>
            {regalo && (
              <div className="space-y-3">
                <Field label="¿Para quién es?"><Input name="regalo_para" /></Field>
                <Field label="Mensaje para la tarjeta"><Textarea name="regalo_mensaje" maxLength={300} /></Field>
              </div>
            )}
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-bold">¿Dónde la retirás?</legend>
              {([['retiro_petruca', config.bolsa.direccion_petruca ?? 'Local de Petruca · calle Espejo, Ciudad de Mendoza'], ['retiro_festival', 'El día del festival (19/12)']] as const).map(([v, t]) => (
                <label key={v} className={`flex cursor-pointer gap-3 rounded-2xl p-3 ring-2 ${entrega === v ? 'bg-secundario/40 ring-bosque' : 'ring-secundario'}`}>
                  <input type="radio" name="entrega" checked={entrega === v} onChange={() => setEntrega(v)} className="mt-1 size-5 accent-bosque" />
                  <span className="font-semibold">{t}</span>
                </label>
              ))}
            </fieldset>
            <DatosComprador />
            <MetodoPago valor={metodo} onChange={setMetodo} conMP={conMP} />
            <div className="space-y-1 border-t border-secundario pt-3 text-sm">
              <p className="flex justify-between"><span>{cantBolsa} × {bolsa.nombre}</span><span>{pesos(cantBolsa * bolsa.precio_base)}</span></p>
              {totalExtras > 0 && <p className="flex justify-between"><span>Extras</span><span>{pesos(totalExtras)}</span></p>}
              <p className="flex items-baseline justify-between pt-1"><span className="text-base font-bold">Total</span><span className="font-display text-3xl font-bold">{pesos(total)}</span></p>
            </div>
            {error && <Alerta tipo="error">{error}</Alerta>}
            <Button grande disabled={enviando} className="!bg-amor !text-white">{enviando ? 'Enviando…' : 'Confirmar pedido'}</Button>
          </Card>
        )}
      </form>
    </div>
  )
}
