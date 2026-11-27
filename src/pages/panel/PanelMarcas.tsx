import { useEffect, useState, type ChangeEvent } from 'react'
import { Alerta, Button, Card, Field, Input, Select, Spinner, Textarea } from '../../components/ui'
import { fechaHora, pesos } from '../../lib/format'
import { rpc, supabase, urlPublica } from '../../lib/supabase'
import { linkWa, origen } from '../../lib/whatsapp'
import { copiarTexto } from '../../lib/copiar'
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
  const [filtro, setFiltro] = useState<(typeof ESTADOS)[number]>('confirmada')
  const [sel, setSel] = useState<Marca | null>(null)
  const [invitada, setInvitada] = useState<Marca | null>(null)

  const cargar = () => supabase.from('marcas').select('*').order('orden').order('nombre').then(({ data }) => setMarcas((data as Marca[]) ?? []))
  useEffect(() => { cargar() }, [])

  if (sel) return <EditorMarca marca={sel} onVolver={() => { setSel(null); cargar() }} />
  if (invitada) return <InvitacionLista m={invitada} onVolver={() => { setInvitada(null); cargar() }} />
  const conteo = (e: string) => (marcas ?? []).filter((m) => m.estado === e).length

  async function nueva(conRegistro = false) {
    const nombre = prompt(conRegistro ? 'Nombre de la marca a invitar (después ella completa el resto):' : 'Nombre de la marca:')
    if (!nombre) return
    const slug = nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36).slice(-3)
    const { data, error } = await supabase.from('marcas').insert({ nombre, slug, estado: 'confirmada', participa_festival: true }).select('*').single()
    if (error) { alert(error.message); return }
    const marca = data as Marca
    if (conRegistro) {
      try { setInvitada({ ...marca, registro_token: await rpc<string>('registro_generar', { p_marca_id: marca.id }), registro_abierto: true }) }
      catch (e) { alert((e as Error).message); cargar() }
      return
    }
    setSel(marca)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-3xl font-bold">Marcas aliadas</h1>
        <div className="flex flex-wrap gap-2"><Button onClick={() => nueva(true)}>+ Invitar marca a registrarse</Button><Button variante="suave" onClick={() => nueva(false)}>+ Cargarla yo</Button></div></div>
      <p className="text-sm text-bosque/70"><strong>Invitar:</strong> ponés solo el nombre y le mandás un link privado para que la marca complete sus datos, logo y productos. <strong>Cargarla yo:</strong> completás vos toda la ficha.</p>
      <InvitarSponsor />
      <div className="flex gap-2">
        {ESTADOS.map((e) => (
          <button key={e} onClick={() => setFiltro(e)} aria-pressed={filtro === e}
            className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${filtro === e ? 'bg-bosque text-white' : 'bg-secundario/60'}`}>
            {{ postulada: 'Postuladas', confirmada: 'Confirmadas', rechazada: 'Rechazadas' }[e]} ({conteo(e)})
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
                {m.registro_token && <p className="mt-1 text-xs font-bold">{m.registro_completado_at ? '✅ Registro completo' : '⏳ Registro pendiente'}{!m.registro_abierto && ' · link cerrado'}</p>}
                {m.estado === 'postulada' && <p className="mt-1 text-xs text-bosque/70">Postulada {m.created_at ? fechaHora(m.created_at) : ''} · {m.contacto_interno}</p>}
                {m.notas_internas?.match(/^Nivel: (.+)$/m) && <p className="mt-1 text-xs font-bold">Nivel: {m.notas_internas.match(/^Nivel: (.+)$/m)![1]}</p>}
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
    const { id: _id, created_at: _c, registro_token: _t, registro_abierto: _a, registro_completado_at: _rc, registro_extra: _re, ...campos } = m
    const { error } = await supabase.from('marcas').update(campos).eq('id', m.id)
    setMsg(error ? { tipo: 'error', t: error.message } : { tipo: 'exito', t: 'Marca guardada ✓' })
  }

  async function logo(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    try { const p = await subirImagen('marcas', m.slug, f); set('logo_path', p); await supabase.from('marcas').update({ logo_path: p }).eq('id', m.id) }
    catch (err) { setMsg({ tipo: 'error', t: (err as Error).message }) }
  }

  const [borrar, setBorrar] = useState<'' | 'confirmar' | 'borrando' | string>('')
  async function eliminar() {
    setBorrar('borrando')
    const { data, error } = await supabase.from('marcas').delete().eq('id', m.id).select('id')
    if (error) { setBorrar('Error: ' + error.message); return }
    if (!data || data.length === 0) { setBorrar('Error: no se borró ninguna marca (¿tenés el rol Alianzas o Admin?).'); return }
    onVolver()
  }

  async function nuevoProducto() {
    await supabase.from('productos').insert({ marca_id: m.id, nombre: 'Producto nuevo', orden: prods.length + 1 }); cargarProds()
  }

  return (
    <div className="space-y-5">
      <button onClick={onVolver} className="font-bold underline">← Volver a marcas aliadas</button>
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
      <RegistroPrivado m={m} onCambio={(c) => setM((x) => ({ ...x, ...c }))} />
      {msg && <Alerta tipo={msg.tipo}>{msg.t}</Alerta>}
      <Button grande onClick={guardar}>Guardar marca</Button>

      <Card className="space-y-2 ring-error/40">
        <h2 className="text-lg font-bold">Eliminar marca</h2>
        <p className="text-sm">Borra la marca y todos sus productos. No se puede deshacer. Si solo no va a participar, podés marcarla como <strong>Rechazada</strong>.</p>
        {borrar === '' && <Button variante="peligro" onClick={() => setBorrar('confirmar')}>Eliminar {m.nombre}</Button>}
        {borrar === 'confirmar' && (
          <div className="space-y-2 rounded-2xl bg-error/10 p-3">
            <p className="font-bold">¿Seguro? Se borra “{m.nombre}” con todos sus productos.</p>
            <div className="flex flex-wrap gap-2">
              <Button variante="peligro" onClick={eliminar}>Sí, eliminar</Button>
              <Button variante="borde" onClick={() => setBorrar('')}>Cancelar</Button>
            </div>
          </div>
        )}
        {borrar === 'borrando' && <p className="font-bold">Eliminando…</p>}
        {borrar.startsWith('Error') && (
          <div className="space-y-2"><Alerta tipo="error">{borrar}</Alerta><Button variante="borde" onClick={() => setBorrar('')}>Volver a intentar</Button></div>
        )}
      </Card>

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

const EXTRA_TXT: Record<string, string> = {
  contacto_nombre: 'Contacto', contacto_whatsapp: 'WhatsApp de contacto', contacto_email: 'Email de contacto',
  canje_oferta: 'Ofrece para el canje', medios_pago: 'Medios de pago', necesidades: 'Necesita para el puesto', comentarios: 'Comentarios',
}

function RegistroPrivado({ m, onCambio }: { m: Marca; onCambio: (c: Partial<Marca>) => void }) {
  const [msg, setMsg] = useState('')
  const url = m.registro_token ? `${origen()}/registro/${m.registro_token}` : ''
  const contacto = m.registro_extra?.contacto_whatsapp || m.whatsapp
  const texto = textoInvitacion(m.nombre, url)

  async function generar() {
    try { onCambio({ registro_token: await rpc<string>('registro_generar', { p_marca_id: m.id }), registro_abierto: true }) }
    catch (e) { setMsg((e as Error).message) }
  }
  async function cerrar() {
    if (!confirm('¿Cerrar el link? La marca ya no va a poder editar sus datos (lo podés volver a abrir).')) return
    try { await rpc('registro_cerrar', { p_marca_id: m.id }); onCambio({ registro_abierto: false }) } catch (e) { setMsg((e as Error).message) }
  }
  const copiar = async () => { setMsg(await copiarTexto(url) ? 'Link copiado ✓ Ya lo podés pegar.' : 'Tu navegador no dejó copiar: tocá el link de arriba, seleccionalo y copialo a mano.'); setTimeout(() => setMsg(''), 4000) }

  return (
    <Card className="space-y-3" acento="var(--color-arcilla)">
      <h2 className="text-xl font-bold">Link de registro para la marca</h2>
      {!m.registro_token || !m.registro_abierto ? (
        <>
          <p className="text-sm">{m.registro_token ? 'El link está cerrado: la marca no puede editar.' : 'Generá un link para que la marca complete sus datos, logo y productos.'}</p>
          <Button onClick={generar}>{m.registro_token ? 'Reabrir link' : 'Generar link de registro'}</Button>
        </>
      ) : (
        <>
          <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} onClick={(e) => e.currentTarget.select()}
          aria-label="Link de registro" className="w-full rounded-xl bg-fondo p-3 font-mono text-xs" />
          <div className="flex flex-wrap gap-2">
            <a href={linkWa(contacto, texto)} target="_blank" rel="noreferrer" className="rounded-2xl bg-exito px-4 py-3 font-bold text-white">📲 Enviar por WhatsApp</a>
            <Button variante="suave" onClick={copiar}>Copiar link</Button>
            <Button variante="borde" onClick={cerrar}>Cerrar link</Button>
          </div>
        </>
      )}
      <p className="text-sm font-bold">{m.registro_completado_at ? `✅ Completado el ${fechaHora(m.registro_completado_at)}` : m.registro_token ? '⏳ Todavía no lo completó' : ''}</p>
      {m.registro_extra && Object.keys(m.registro_extra).length > 0 && (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {Object.entries(m.registro_extra).map(([k, v]) => (
            <div key={k} className="rounded-xl bg-fondo p-3"><dt className="font-bold">{EXTRA_TXT[k] ?? k}</dt><dd className="whitespace-pre-line">{v}</dd></div>
          ))}
        </dl>
      )}
      {msg && <p className="text-sm font-bold">{msg}</p>}
    </Card>
  )
}

const textoInvitacion = (nombre: string, url: string) =>
  `¡Hola! 🌿 Te compartimos el link para completar el registro de ${nombre} en el Festival de Solsticio de Micelia: ${url}\n\nAhí podés cargar tus datos, logo y productos. Podés volver a entrar y editarlo cuando quieras.`

function InvitacionLista({ m, onVolver }: { m: Marca; onVolver: () => void }) {
  const [copiado, setCopiado] = useState<'' | 'si' | 'no'>('')
  const url = `${origen()}/registro/${m.registro_token}`
  const copiar = async () => { setCopiado(await copiarTexto(url) ? 'si' : 'no'); setTimeout(() => setCopiado(''), 4000) }
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <button onClick={onVolver} className="font-bold underline">← Volver a marcas aliadas</button>
      <Card className="space-y-4" acento="var(--color-arcilla)">
        <h1 className="text-2xl font-bold">Link listo para {m.nombre} 🌿</h1>
        <p>Mandáselo a la marca: con ese link completa sus datos, logo y productos. Cuando lo complete, te llega un aviso por mail y la ves como <strong>✅ Registro completo</strong>.</p>
        <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} onClick={(e) => e.currentTarget.select()}
          aria-label="Link de registro" className="w-full rounded-xl bg-fondo p-3 font-mono text-xs" />
        <div className="flex flex-col gap-2 sm:flex-row">
          <a href={linkWa(null, textoInvitacion(m.nombre, url))} target="_blank" rel="noreferrer"
            className="rounded-2xl bg-exito px-5 py-3 text-center font-bold text-white">📲 Enviar por WhatsApp</a>
          <Button variante="suave" onClick={copiar}>{copiado === 'si' ? '¡Copiado!' : 'Copiar link'}</Button>
        </div>
        {copiado === 'si' && <p className="text-sm font-bold text-exito">Link copiado ✓ Ya lo podés pegar en WhatsApp.</p>}
        {copiado === 'no' && <p className="text-sm font-bold text-error">Tu navegador no dejó copiar: tocá el link de arriba, seleccionalo y copialo a mano.</p>}
        <p className="text-sm text-bosque/70">Si lo necesitás de nuevo, entrá a la marca en la lista: el link queda guardado ahí.</p>
      </Card>
      <Button variante="borde" onClick={onVolver}>Listo, volver a la lista</Button>
    </div>
  )
}

function InvitarSponsor() {
  const [nombre, setNombre] = useState('')
  const [proyecto, setProyecto] = useState('')
  const [copiado, setCopiado] = useState<'' | 'si' | 'no'>('')
  const url = `${origen()}/propuesta`
  const mensaje = `Hola${nombre ? ' ' + nombre.trim() : ''}. Con Micelia, una cooperativa de trabajo de mujeres, estamos armando el Festival de Solsticio el sábado 19/12 en una casona con parque en Guaymallén. Va a ser un día de arte, música, juegos, magia, comiditas ricas y marcas con sentido, con yoga y cierre consciente de solsticio por la mañana, y el festival con cierre artístico por la tarde.

Nos encantaría que ${proyecto.trim() || 'tu proyecto'} sea parte como sponsor. Acá te cuento qué recibe tu comunidad y cómo sumarte, con los niveles Semilla, Raíz y Copa: ${url}

¿Te parece que lo conversemos esta semana?`
  const copiar = async () => { setCopiado(await copiarTexto(mensaje) ? 'si' : 'no'); setTimeout(() => setCopiado(''), 4000) }
  return (
    <details className="rounded-3xl bg-superficie p-4 ring-1 ring-secundario/60">
      <summary className="cursor-pointer text-lg font-bold">💌 Invitar a ser sponsor (mensaje + propuesta)</summary>
      <div className="mt-3 space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input placeholder="Nombre de la persona" value={nombre} onChange={(e) => setNombre(e.target.value)} aria-label="Nombre de la persona" />
          <Input placeholder="Su proyecto o marca" value={proyecto} onChange={(e) => setProyecto(e.target.value)} aria-label="Proyecto o marca" />
        </div>
        <Textarea rows={8} readOnly value={mensaje} aria-label="Mensaje" onFocus={(e) => e.currentTarget.select()} />
        <div className="flex flex-wrap gap-2">
          <a href={linkWa(null, mensaje)} target="_blank" rel="noreferrer" className="rounded-2xl bg-exito px-4 py-3 font-bold text-white">📲 Enviar por WhatsApp</a>
          <Button variante="suave" onClick={copiar}>{copiado === 'si' ? '¡Copiado!' : 'Copiar mensaje'}</Button>
          <a href="/propuesta" target="_blank" rel="noreferrer" className="self-center text-sm font-bold underline">Ver la propuesta ↗</a>
        </div>
        {copiado === 'no' && <p className="text-sm font-bold text-error">Tu navegador no dejó copiar: tocá el mensaje, seleccionalo y copialo a mano.</p>}
      </div>
    </details>
  )
}
