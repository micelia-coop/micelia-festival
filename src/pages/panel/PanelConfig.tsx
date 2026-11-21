import { useEffect, useState, type ChangeEvent } from 'react'
import { Alerta, Button, Card, Field, Input, Textarea } from '../../components/ui'
import { useConfig } from '../../lib/config'
import { pesos } from '../../lib/format'
import { supabase, urlPublica } from '../../lib/supabase'

type Campo = { k: string; label: string; tipo?: 'texto' | 'largo' | 'bool' | 'fecha' | 'fechahora'; hint?: string }

const SECCIONES: { clave: string; titulo: string; campos: Campo[] }[] = [
  { clave: 'sitio', titulo: 'Sitio público: qué se ve', campos: [
    { k: 'teaser', label: 'Modo "Próximamente" en el inicio (solo fecha, contador y botón al desafío)', tipo: 'bool' },
    { k: 'mostrar_entradas', label: 'Mostrar Entradas', tipo: 'bool' },
    { k: 'mostrar_bolsa', label: 'Mostrar Bolsa Ritual', tipo: 'bool' },
    { k: 'mostrar_marcas', label: 'Mostrar Guía de regalos (marcas)', tipo: 'bool' },
    { k: 'mostrar_postulacion', label: 'Mostrar "Sumá tu marca" (postulación abierta)', tipo: 'bool' },
    { k: 'mostrar_info', label: 'Mostrar Info y FAQ', tipo: 'bool' },
    { k: 'mostrar_recorrido', label: 'Mostrar "El recorrido" en el inicio completo', tipo: 'bool' },
    { k: 'teaser_kicker', label: 'Próximamente · línea de arriba' }, { k: 'teaser_titulo', label: 'Próximamente · título grande' },
    { k: 'teaser_bajada', label: 'Próximamente · bajada' }, { k: 'teaser_fecha_label', label: 'Próximamente · texto sobre la fecha' },
    { k: 'teaser_fecha', label: 'Próximamente · fecha' },
    { k: 'cuenta_hasta', label: 'Cuenta regresiva hasta', tipo: 'fechahora', hint: 'Hora de Mendoza' },
  ] },
  { clave: 'ventas', titulo: 'Ventas', campos: [
    { k: 'entradas_abiertas', label: 'Venta de entradas abierta', tipo: 'bool' },
    { k: 'bolsas_abiertas', label: 'Venta de Bolsa Ritual abierta', tipo: 'bool' },
    { k: 'mensaje_cerrado', label: 'Mensaje cuando la venta está cerrada', tipo: 'largo' },
  ] },
  { clave: 'pago', titulo: 'Datos para transferir', campos: [
    { k: 'billetera', label: 'Billetera / banco' }, { k: 'alias', label: 'Alias' }, { k: 'cvu', label: 'CVU' }, { k: 'titular', label: 'Titular' },
  ] },
  { clave: 'festival', titulo: 'Festival', campos: [
    { k: 'nombre', label: 'Nombre' }, { k: 'organiza', label: 'Organiza' }, { k: 'fecha', label: 'Fecha', tipo: 'fecha' },
    { k: 'bajada', label: 'Bajada del inicio', tipo: 'largo' },
    { k: 'lugar', label: 'Lugar', hint: 'Vacío = "a confirmar"' }, { k: 'lugar_direccion', label: 'Dirección' }, { k: 'lugar_maps_url', label: 'Link de Google Maps' },
    { k: 'instagram_url', label: 'Link de Instagram' }, { k: 'telegram_url', label: 'Link de la comunidad de Telegram' },
    { k: 'whatsapp_contacto', label: 'WhatsApp de contacto', hint: 'Para consultas del público' },
  ] },
  { clave: 'desafio', titulo: 'Textos del Desafío', campos: [
    { k: 'titulo', label: 'Título' }, { k: 'bajada', label: 'Bajada', tipo: 'largo' }, { k: 'gestiona', label: 'Lo gestiona' },
    { k: 'consentimiento', label: 'Texto de consentimiento', tipo: 'largo' },
  ] },
  { clave: 'bolsa', titulo: 'Retiro de bolsas', campos: [{ k: 'direccion_petruca', label: 'Texto del punto de retiro en Petruca' }] },
  { clave: 'canje', titulo: 'Franja de canje (día del festival)', campos: [
    { k: 'fecha', label: 'Fecha', tipo: 'fecha' }, { k: 'desde', label: 'Desde (HH:MM)' }, { k: 'hasta', label: 'Hasta (HH:MM)' },
  ] },
]

export default function PanelConfig() {
  const { config, recargar } = useConfig()
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configuración</h1>
      {SECCIONES.map((s) => <SeccionCfg key={s.clave} {...s} valor={(config as unknown as Record<string, Record<string, unknown>>)[s.clave] ?? {}} onGuardado={recargar} />)}
      <TiposEntrada />
      <Bolsas />
      <FaqEditor faq={config.faq ?? []} onGuardado={recargar} />
    </div>
  )
}

function SeccionCfg({ clave, titulo, campos, valor, onGuardado }: { clave: string; titulo: string; campos: Campo[]; valor: Record<string, unknown>; onGuardado: () => void }) {
  const [v, setV] = useState(valor)
  const [msg, setMsg] = useState('')
  useEffect(() => setV(valor), [valor])
  async function guardar() {
    const limpio = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, typeof x === 'string' && x.trim() === '' ? null : x]))
    const { error } = await supabase.from('config').upsert({ clave, valor: limpio })
    setMsg(error ? 'Error: ' + error.message : 'Guardado ✓'); if (!error) onGuardado(); setTimeout(() => setMsg(''), 2500)
  }
  return (
    <Card className="space-y-3">
      <h2 className="text-xl font-bold">{titulo}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {campos.map((c) => c.tipo === 'bool' ? (
          <label key={c.k} className="flex items-center gap-2 font-bold md:col-span-2">
            <input type="checkbox" className="size-6 accent-bosque" checked={v[c.k] === true} onChange={(e) => setV({ ...v, [c.k]: e.target.checked })} /> {c.label}
          </label>
        ) : (
          <div key={c.k} className={c.tipo === 'largo' ? 'md:col-span-2' : ''}>
            <Field label={c.label} hint={c.hint}>
              {c.tipo === 'largo'
                ? <Textarea value={String(v[c.k] ?? '')} onChange={(e) => setV({ ...v, [c.k]: e.target.value })} />
                : <Input type={c.tipo === 'fecha' ? 'date' : c.tipo === 'fechahora' ? 'datetime-local' : 'text'} value={String(v[c.k] ?? '')} onChange={(e) => setV({ ...v, [c.k]: e.target.value })} />}
            </Field>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3"><Button onClick={guardar}>Guardar</Button><span className="font-bold">{msg}</span></div>
    </Card>
  )
}

type Tipo = { id: string; nombre: string; descripcion: string | null; precio: number; cupo: number | null; valor_canje: number; incluye_almuerzo: boolean; incluye_festival: boolean; pregunta_mat: boolean; venta_online: boolean; activo: boolean; orden: number }

function TiposEntrada() {
  const [tipos, setTipos] = useState<Tipo[]>([])
  const [msg, setMsg] = useState('')
  useEffect(() => { supabase.from('tipos_entrada').select('*').order('orden').then(({ data }) => setTipos((data as Tipo[]) ?? [])) }, [])
  const set = (id: string, k: keyof Tipo, val: unknown) => setTipos((ts) => ts.map((t) => (t.id === id ? { ...t, [k]: val } : t)))
  async function guardar(t: Tipo) {
    const { id, ...c } = t
    const { error } = await supabase.from('tipos_entrada').update(c).eq('id', id)
    setMsg(error ? 'Error: ' + error.message : `${t.nombre} guardado ✓`); setTimeout(() => setMsg(''), 2500)
  }
  const num = (v: string) => (v === '' ? null : Number(v))
  return (
    <Card className="space-y-4">
      <h2 className="text-xl font-bold">Tipos de entrada</h2>
      {msg && <Alerta tipo={msg.startsWith('Error') ? 'error' : 'exito'}>{msg}</Alerta>}
      {tipos.map((t) => (
        <div key={t.id} className="space-y-2 rounded-2xl bg-fondo p-4">
          <Input value={t.nombre} onChange={(e) => set(t.id, 'nombre', e.target.value)} aria-label="Nombre" className="font-bold" />
          <Textarea rows={2} value={t.descripcion ?? ''} onChange={(e) => set(t.id, 'descripcion', e.target.value)} aria-label="Descripción" />
          <div className="grid grid-cols-3 gap-2">
            <Field label="Precio"><Input type="number" value={t.precio} onChange={(e) => set(t.id, 'precio', Number(e.target.value))} /></Field>
            <Field label="Cupo" hint="Vacío = sin tope"><Input type="number" value={t.cupo ?? ''} onChange={(e) => set(t.id, 'cupo', num(e.target.value))} /></Field>
            <Field label="Valor de canje" hint="0 = no canjeable"><Input type="number" value={t.valor_canje} onChange={(e) => set(t.id, 'valor_canje', Number(e.target.value))} /></Field>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-semibold">
            {(['incluye_almuerzo', 'incluye_festival', 'pregunta_mat', 'venta_online', 'activo'] as const).map((k) => (
              <label key={k} className="flex items-center gap-2"><input type="checkbox" className="size-5 accent-bosque" checked={t[k]} onChange={(e) => set(t.id, k, e.target.checked)} />
                {{ incluye_almuerzo: 'Incluye almuerzo', incluye_festival: 'Incluye festival', pregunta_mat: 'Pregunta si trae mat', venta_online: 'Se vende online', activo: 'Activo' }[k]}</label>
            ))}
          </div>
          <Button onClick={() => guardar(t)}>Guardar</Button>
        </div>
      ))}
    </Card>
  )
}

type Bolsa = { id: string; nombre: string; slug: string; descripcion: string | null; precio_base: number; foto_path: string | null; activo: boolean; orden: number }
type Prod = { id: string; nombre: string; marcas: { nombre: string } | null }

function Bolsas() {
  const [bolsas, setBolsas] = useState<Bolsa[]>([])
  const [prods, setProds] = useState<Prod[]>([])
  const [base, setBase] = useState<{ bolsa_id: string; producto_id: string }[]>([])
  const [msg, setMsg] = useState('')
  const cargar = () => Promise.all([
    supabase.from('bolsas').select('*').order('orden'),
    supabase.from('productos').select('id,nombre,marcas(nombre)').order('nombre'),
    supabase.from('bolsa_items_base').select('bolsa_id,producto_id'),
  ]).then(([b, p, bi]) => { setBolsas((b.data as Bolsa[]) ?? []); setProds((p.data as unknown as Prod[]) ?? []); setBase(bi.data ?? []) })
  useEffect(() => { cargar() }, [])
  const set = (id: string, k: keyof Bolsa, v: unknown) => setBolsas((bs) => bs.map((b) => (b.id === id ? { ...b, [k]: v } : b)))

  async function guardar(b: Bolsa) {
    const { id, ...c } = b
    const { error } = await supabase.from('bolsas').update(c).eq('id', id)
    setMsg(error ? 'Error: ' + error.message : 'Bolsa guardada ✓'); setTimeout(() => setMsg(''), 2500)
  }
  async function toggleBase(bolsa_id: string, producto_id: string, on: boolean) {
    if (on) await supabase.from('bolsa_items_base').insert({ bolsa_id, producto_id, cantidad: 1 })
    else await supabase.from('bolsa_items_base').delete().eq('bolsa_id', bolsa_id).eq('producto_id', producto_id)
    cargar()
  }
  async function foto(b: Bolsa, e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const path = `bolsas/${b.slug}-${Date.now()}.${(f.name.split('.').pop() || 'jpg').toLowerCase()}`
    const { error } = await supabase.storage.from('festival').upload(path, f, { contentType: f.type || undefined })
    if (error) { setMsg('Error: ' + error.message); return }
    await supabase.from('bolsas').update({ foto_path: path }).eq('id', b.id); cargar()
  }
  async function nueva() {
    const nombre = prompt('Nombre de la nueva bolsa:'); if (!nombre) return
    await supabase.from('bolsas').insert({ nombre, slug: `bolsa-${Date.now().toString(36)}`, precio_base: 0, activo: false, orden: bolsas.length + 1 }); cargar()
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Bolsas</h2><Button variante="suave" onClick={nueva}>+ Otra bolsa</Button></div>
      {msg && <Alerta tipo={msg.startsWith('Error') ? 'error' : 'exito'}>{msg}</Alerta>}
      {bolsas.map((b) => (
        <div key={b.id} className="space-y-2 rounded-2xl bg-fondo p-4">
          <Input value={b.nombre} onChange={(e) => set(b.id, 'nombre', e.target.value)} className="font-bold" aria-label="Nombre" />
          <Textarea rows={2} value={b.descripcion ?? ''} onChange={(e) => set(b.id, 'descripcion', e.target.value)} aria-label="Descripción" />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Precio base" hint={pesos(b.precio_base)}><Input type="number" value={b.precio_base} onChange={(e) => set(b.id, 'precio_base', Number(e.target.value))} /></Field>
            <label className="flex items-center gap-2 self-center font-bold"><input type="checkbox" className="size-5 accent-bosque" checked={b.activo} onChange={(e) => set(b.id, 'activo', e.target.checked)} /> Visible</label>
          </div>
          <div className="flex items-center gap-3">
            {b.foto_path && <img src={urlPublica('festival', b.foto_path)} alt="" className="size-16 rounded-xl object-cover" />}
            <label className="cursor-pointer rounded-2xl bg-secundario/60 px-3 py-2 text-sm font-bold">Foto<input type="file" accept="image/*" className="sr-only" onChange={(e) => foto(b, e)} /></label>
            <Button onClick={() => guardar(b)}>Guardar</Button>
          </div>
          <details><summary className="cursor-pointer font-bold">Productos base ({base.filter((x) => x.bolsa_id === b.id).length})</summary>
            <div className="mt-2 grid gap-1 sm:grid-cols-2">
              {prods.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="size-5 accent-bosque" checked={base.some((x) => x.bolsa_id === b.id && x.producto_id === p.id)}
                    onChange={(e) => toggleBase(b.id, p.id, e.target.checked)} /> {p.nombre} <span className="text-bosque/60">· {p.marcas?.nombre}</span>
                </label>
              ))}
            </div>
          </details>
        </div>
      ))}
      <p className="text-sm text-bosque/70">Los productos y los extras se cargan en Marcas → cada marca → Productos (tildá "Extra de la Bolsa Ritual").</p>
    </Card>
  )
}

function FaqEditor({ faq, onGuardado }: { faq: { p: string; r: string }[]; onGuardado: () => void }) {
  const [lista, setLista] = useState(faq)
  const [msg, setMsg] = useState('')
  useEffect(() => setLista(faq), [faq])
  const set = (i: number, k: 'p' | 'r', v: string) => setLista((l) => l.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
  async function guardar() {
    const { error } = await supabase.from('config').upsert({ clave: 'faq', valor: lista.filter((x) => x.p.trim()) })
    setMsg(error ? 'Error: ' + error.message : 'Guardado ✓'); if (!error) onGuardado(); setTimeout(() => setMsg(''), 2500)
  }
  return (
    <Card className="space-y-3">
      <h2 className="text-xl font-bold">Preguntas frecuentes</h2>
      {lista.map((q, i) => (
        <div key={i} className="space-y-1 rounded-2xl bg-fondo p-3">
          <Input value={q.p} onChange={(e) => set(i, 'p', e.target.value)} placeholder="Pregunta" className="font-bold" />
          <Textarea value={q.r} onChange={(e) => set(i, 'r', e.target.value)} placeholder="Respuesta" />
          <button className="text-sm font-bold text-error underline" onClick={() => setLista(lista.filter((_, j) => j !== i))}>Quitar</button>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <Button variante="suave" onClick={() => setLista([...lista, { p: '', r: '' }])}>+ Pregunta</Button>
        <Button onClick={guardar}>Guardar FAQ</Button><span className="font-bold">{msg}</span>
      </div>
    </Card>
  )
}
