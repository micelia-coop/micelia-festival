import { useEffect, useState, type ChangeEvent } from 'react'
import { Alerta, Button, Card, Field, Input, Select, Spinner, Textarea } from '../../components/ui'
import { fechaHora, pesos } from '../../lib/format'
import { supabase, urlPublica } from '../../lib/supabase'
import type { Marca, Producto } from '../../lib/types'

const TIPOS = ['guardiana', 'feriante', 'invitada', 'micelia', 'gastronomia', 'alianza']
const ESTADOS = ['postulada', 'confirmada', 'rechazada'] as const

async function subirImagen(bucket: string, carpeta: string, file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${carpeta}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type || undefined, upsert: true })
  if (error) throw new Error('No se pudo subir la imagen: ' + error.message)
  return path
}

export default function PanelMarcas() {
  const [marcas, setMarcas] = useState<Marca[] | null>(null)
  const [filtro, setFiltro] = useState<(typeof ESTADOS)[number]>('postulada')
  const [sel, setSel] = useState<Marca | null>(null)

  const cargar = () => supabase.from('marcas').select('*').order('orden').order('nombre').then(({ data }) => setMarcas((data as Marca[]) ?? []))
  useEffect(() => { cargar() }, [])

  if (sel) return <EditorMarca marca={sel} onVolver={() => { setSel(null); cargar() }} />
  const conteo = (e: string) => (marcas ?? []).filter((m) => m.estado === e).length

  async function nueva() {
    const nombre = prompt('Nombre de la marca:')
    if (!nombre) return
    const slug = nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36).slice(-3)
    const { data, error } = await supabase.from('marcas').insert({ nombre, slug, estado: 'confirmada' }).select('*').single()
    if (error) { alert(error.message); return }
    setSel(data as Marca)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><h1 className="text-3xl font-bold">Marcas</h1><Button onClick={nueva}>+ Nueva marca</Button></div>
      <div className="flex gap-2">
        {ESTADOS.map((e) => (
          <button key={e} onClick={() => setFiltro(e)} aria-pressed={filtro === e}
            className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${filtro === e ? 'bg-bosque text-white' : 'bg-secundario/60'}`}>
            {e}s ({conteo(e)})
          </button>
        ))}
      </div>
      {!marcas ? <Spinner /> : (
        <ul className="grid gap-2 md:grid-cols-2">
          {marcas.filter((m) => m.estado === filtro).map((m) => (
            <li key={m.id}><button className="w-full text-left" onClick={() => setSel(m)}>
              <Card className="!p-4">
                <p className="text-lg font-bold">{m.nombre} <span className="text-sm font-semibold text-bosque/60">· {m.tipo}</span></p>
                <p className="text-sm">{m.rubro ?? 'Sin rubro'} {m.en_guia_regalos && '· 🎁 guía'} {m.participa_festival && '· 🌿 festival'}</p>
                {m.estado === 'postulada' && <p className="mt-1 text-xs text-bosque/70">Postulada {m.created_at ? fechaHora(m.created_at) : ''} · {m.contacto_interno}</p>}
              </Card>
            </button></li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EditorMarca({ marca, onVolver }: { marca: Marca; onVolver: () => void }) {
  const [m, setM] = useState<Marca>(marca)
  const [prods, setProds] = useState<Producto[]>([])
  const [msg, setMsg] = useState<{ tipo: 'exito' | 'error'; t: string } | null>(null)
  const set = <K extends keyof Marca>(k: K, v: Marca[K]) => setM((x) => ({ ...x, [k]: v }))

  const cargarProds = () => supabase.from('productos').select('*').eq('marca_id', marca.id).order('orden').then(({ data }) => setProds((data as Producto[]) ?? []))
  useEffect(() => { cargarProds() }, [])

  async function guardar() {
    const { id: _id, created_at: _c, ...campos } = m
    const { error } = await supabase.from('marcas').update(campos).eq('id', m.id)
    setMsg(error ? { tipo: 'error', t: error.message } : { tipo: 'exito', t: 'Marca guardada ✓' })
  }

  async function logo(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    try { const p = await subirImagen('marcas', m.slug, f); set('logo_path', p); await supabase.from('marcas').update({ logo_path: p }).eq('id', m.id) }
    catch (err) { setMsg({ tipo: 'error', t: (err as Error).message }) }
  }

  async function nuevoProducto() {
    await supabase.from('productos').insert({ marca_id: m.id, nombre: 'Producto nuevo', orden: prods.length + 1 }); cargarProds()
  }

  return (
    <div className="space-y-5">
      <button onClick={onVolver} className="font-bold underline">← Volver a marcas</button>
      <h1 className="text-3xl font-bold">{m.nombre}</h1>
      <div className="flex flex-wrap gap-2">
        {ESTADOS.map((e) => (
          <Button key={e} variante={m.estado === e ? 'primario' : 'suave'} onClick={() => set('estado', e)} className="capitalize">{e === 'confirmada' ? '✓ Confirmar' : e === 'rechazada' ? 'Rechazar' : 'Postulada'}</Button>
        ))}
      </div>
      <Card className="grid gap-3 md:grid-cols-2">
        <Field label="Nombre"><Input value={m.nombre} onChange={(e) => set('nombre', e.target.value)} /></Field>
        <Field label="Link (slug)" hint={`/marcas/${m.slug}`}><Input value={m.slug} onChange={(e) => set('slug', e.target.value)} /></Field>
        <Field label="Tipo"><Select value={m.tipo} onChange={(e) => set('tipo', e.target.value)}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</Select></Field>
        <Field label="Rubro"><Input value={m.rubro ?? ''} onChange={(e) => set('rubro', e.target.value)} /></Field>
        <div className="md:col-span-2"><Field label="Descripción pública"><Textarea value={m.descripcion ?? ''} onChange={(e) => set('descripcion', e.target.value)} /></Field></div>
        <Field label="Instagram"><Input value={m.instagram ?? ''} onChange={(e) => set('instagram', e.target.value)} /></Field>
        <Field label="WhatsApp para pedidos"><Input value={m.whatsapp ?? ''} onChange={(e) => set('whatsapp', e.target.value)} /></Field>
        <Field label="Web"><Input value={m.web ?? ''} onChange={(e) => set('web', e.target.value)} /></Field>
        <Field label="Orden en la guía"><Input type="number" value={m.orden} onChange={(e) => set('orden', Number(e.target.value))} /></Field>
        <label className="flex items-center gap-2 font-bold"><input type="checkbox" className="size-5 accent-bosque" checked={m.en_guia_regalos} onChange={(e) => set('en_guia_regalos', e.target.checked)} /> Aparece en la Guía de regalos</label>
        <label className="flex items-center gap-2 font-bold"><input type="checkbox" className="size-5 accent-bosque" checked={m.participa_festival} onChange={(e) => set('participa_festival', e.target.checked)} /> Participa del festival</label>
        <Field label="Contacto interno (no se publica)"><Input value={m.contacto_interno ?? ''} onChange={(e) => set('contacto_interno', e.target.value)} /></Field>
        <Field label="Notas internas"><Textarea value={m.notas_internas ?? ''} onChange={(e) => set('notas_internas', e.target.value)} /></Field>
        <div className="flex items-center gap-3">
          {m.logo_path && <img src={urlPublica('marcas', m.logo_path)} alt="" className="size-16 rounded-2xl object-cover" />}
          <label className="cursor-pointer rounded-2xl bg-secundario/60 px-4 py-3 font-bold">Subir logo<input type="file" accept="image/*" className="sr-only" onChange={logo} /></label>
        </div>
      </Card>
      {msg && <Alerta tipo={msg.tipo}>{msg.t}</Alerta>}
      <Button grande onClick={guardar}>Guardar marca</Button>

      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">Productos</h2><Button variante="suave" onClick={nuevoProducto}>+ Producto</Button></div>
        {prods.map((p) => <EditorProducto key={p.id} p={p} slug={m.slug} onCambio={cargarProds} />)}
      </section>
    </div>
  )
}

function EditorProducto({ p: inicial, slug, onCambio }: { p: Producto; slug: string; onCambio: () => void }) {
  const [p, setP] = useState(inicial)
  const [ok, setOk] = useState('')
  const set = <K extends keyof Producto>(k: K, v: Producto[K]) => setP((x) => ({ ...x, [k]: v }))
  async function guardar() {
    const { id: _id, marca_id: _m, ...c } = p
    const { error } = await supabase.from('productos').update(c).eq('id', p.id)
    setOk(error ? error.message : 'Guardado ✓'); setTimeout(() => setOk(''), 2000)
  }
  async function foto(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const path = await subirImagen('productos', slug, f); set('foto_path', path)
    await supabase.from('productos').update({ foto_path: path }).eq('id', p.id)
  }
  async function borrar() { if (confirm(`¿Borrar "${p.nombre}"?`)) { await supabase.from('productos').delete().eq('id', p.id); onCambio() } }
  const chk = (k: 'disp_previa' | 'disp_festival' | 'disp_post' | 'agregable_a_bolsa' | 'activo', t: string) => (
    <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="size-5 accent-bosque" checked={p[k]} onChange={(e) => set(k, e.target.checked)} /> {t}</label>
  )
  return (
    <Card className="!p-4 space-y-2">
      <div className="grid gap-2 md:grid-cols-[2fr_1fr]">
        <Input value={p.nombre} onChange={(e) => set('nombre', e.target.value)} aria-label="Nombre del producto" />
        <Input type="number" placeholder="Precio" value={p.precio ?? ''} onChange={(e) => set('precio', e.target.value === '' ? null : Number(e.target.value))} aria-label="Precio" />
      </div>
      <Textarea rows={2} placeholder="Descripción" value={p.descripcion ?? ''} onChange={(e) => set('descripcion', e.target.value)} />
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {chk('disp_previa', 'Antes')}{chk('disp_festival', 'En el festival')}{chk('disp_post', 'Después')}
        {chk('agregable_a_bolsa', 'Extra de la Bolsa Ritual')}{chk('activo', 'Visible')}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {p.foto_path && <img src={urlPublica('productos', p.foto_path)} alt="" className="size-12 rounded-xl object-cover" />}
        <label className="cursor-pointer rounded-2xl bg-secundario/60 px-3 py-2 text-sm font-bold">Foto<input type="file" accept="image/*" className="sr-only" onChange={foto} /></label>
        <Button onClick={guardar} className="!py-2">Guardar</Button>
        <Button variante="borde" onClick={borrar} className="!py-2">Borrar</Button>
        <span className="text-sm font-bold">{ok}</span>
        {p.precio != null && <span className="ml-auto text-sm">{pesos(p.precio)}</span>}
      </div>
    </Card>
  )
}
