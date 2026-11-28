import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { Alerta, Button, Card, Field, Input, Spinner, Textarea, Titulo } from '../../components/ui'
import { useConfig } from '../../lib/config'
import { rpc, supabase, urlPublica } from '../../lib/supabase'

type Prod = { id?: string; nombre: string; descripcion: string | null; precio: number | string | null; foto_path: string | null; disp_previa: boolean; disp_festival: boolean; disp_post: boolean }
type Extra = { contacto_nombre?: string; contacto_whatsapp?: string; contacto_email?: string; canje_oferta?: string; medios_pago?: string; necesidades?: string; comentarios?: string }
type Reg = {
  nombre: string; rubro: string | null; descripcion: string | null; instagram: string | null; whatsapp: string | null; web: string | null
  logo_path: string | null; extra: Extra; completado_at: string | null; carpeta: string; productos: Prod[]
}

const nuevoProd = (): Prod => ({ nombre: '', descripcion: '', precio: '', foto_path: null, disp_previa: true, disp_festival: true, disp_post: true })

async function subir(bucket: string, carpeta: string, file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) throw new Error('La imagen es muy pesada (máximo 5 MB).')
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type || undefined })
  if (error) throw new Error('No se pudo subir la imagen. Probá con un JPG o PNG.')
  return path
}

export default function Registro() {
  const { token = '' } = useParams()
  const { config } = useConfig()
  const [r, setR] = useState<Reg | null | undefined>(undefined)
  const [prods, setProds] = useState<Prod[]>([])
  const [logo, setLogo] = useState<string | null>(null)
  const [estado, setEstado] = useState<'' | 'guardando' | 'ok'>('')
  const [error, setError] = useState('')
  const [subiendo, setSubiendo] = useState('')

  useEffect(() => {
    rpc<Reg | null>('registro_ver', { p_token: token }).then((d) => {
      setR(d)
      if (d) { setProds(d.productos.length ? d.productos : [nuevoProd()]); setLogo(d.logo_path) }
    }).catch(() => setR(null))
  }, [token])

  if (r === undefined) return <Spinner />
  if (r === null) return <Alerta tipo="error">Este link de registro no es válido o ya se cerró. Escribile a Vanesa (Alianzas de Micelia).</Alerta>

  const setP = (i: number, k: keyof Prod, v: unknown) => setProds((ps) => ps.map((p, j) => (j === i ? { ...p, [k]: v } : p)))

  async function subirLogo(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    setSubiendo('logo'); setError('')
    try { setLogo(await subir('marcas', r!.carpeta, f)) } catch (err) { setError((err as Error).message) }
    setSubiendo('')
  }
  async function subirFoto(i: number, e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    setSubiendo(`p${i}`); setError('')
    try { setP(i, 'foto_path', await subir('productos', r!.carpeta, f)) } catch (err) { setError((err as Error).message) }
    setSubiendo('')
  }

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const datos = Object.fromEntries(['nombre', 'rubro', 'descripcion', 'instagram', 'whatsapp', 'web', 'contacto_nombre', 'contacto_whatsapp',
      'contacto_email', 'canje_oferta', 'medios_pago', 'necesidades', 'comentarios'].map((k) => [k, String(f.get(k) ?? '')]))
    setEstado('guardando'); setError('')
    try {
      await rpc('registro_guardar', {
        p_token: token,
        p_datos: { ...datos, logo_path: logo },
        p_productos: prods.filter((p) => p.nombre.trim()).map((p) => ({ ...p, precio: p.precio === '' || p.precio == null ? null : String(p.precio).replace(/\D/g, '') })),
      })
      setEstado('ok'); window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) { setError((err as Error).message); setEstado('') }
  }

  const x = r.extra ?? {}
  return (
    <div className="mx-auto max-w-2xl">
      <Titulo acento="var(--color-arcilla)" bajada={<>Completá los datos de tu marca para el {config.festival.nombre}. Podés volver a este link y editarlo cuando quieras.</>}>
        Registro de marca
      </Titulo>
      {estado === 'ok' && <div className="mb-4"><Alerta tipo="exito">¡Gracias! Guardamos tus datos 🌿 Si necesitás cambiar algo, volvé a este mismo link.</Alerta></div>}
      {r.completado_at && estado !== 'ok' && <div className="mb-4"><Alerta>Ya habías completado el registro. Podés revisar y actualizar lo que quieras.</Alerta></div>}

      <form onSubmit={guardar} className="space-y-5">
        <Card className="space-y-3" acento="var(--color-arcilla)">
          <h2 className="text-xl font-bold">Tu marca</h2>
          <Field label="Nombre de la marca *"><Input name="nombre" required defaultValue={r.nombre} /></Field>
          <Field label="Rubro" hint="Ej: cosmética natural, cerámica, textil, gastronomía"><Input name="rubro" defaultValue={r.rubro ?? ''} /></Field>
          <Field label="Contanos sobre tu marca" hint="Este texto puede aparecer en la Guía de regalos"><Textarea name="descripcion" rows={4} defaultValue={r.descripcion ?? ''} /></Field>
          <Field label="Instagram"><Input name="instagram" placeholder="@tumarca" autoCapitalize="none" defaultValue={r.instagram ?? ''} /></Field>
          <Field label="WhatsApp para pedidos" hint="Es el que va a figurar en la guía para que te escriban"><Input name="whatsapp" type="tel" defaultValue={r.whatsapp ?? ''} /></Field>
          <Field label="Web (opcional)"><Input name="web" defaultValue={r.web ?? ''} /></Field>
          <div className="flex items-center gap-3">
            {logo && <img src={urlPublica('marcas', logo)} alt="Logo" className="size-20 rounded-2xl object-cover ring-1 ring-secundario" />}
            <label className="cursor-pointer rounded-2xl bg-secundario/60 px-4 py-3 font-bold">
              {subiendo === 'logo' ? 'Subiendo…' : logo ? 'Cambiar logo' : 'Subir logo'}
              <input type="file" accept="image/*" className="sr-only" onChange={subirLogo} />
            </label>
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-xl font-bold">Persona de contacto</h2>
          <p className="text-sm text-bosque/70">Solo lo ve el equipo de Micelia.</p>
          <Field label="Nombre *"><Input name="contacto_nombre" required defaultValue={x.contacto_nombre ?? ''} /></Field>
          <Field label="WhatsApp *"><Input name="contacto_whatsapp" type="tel" required defaultValue={x.contacto_whatsapp ?? ''} /></Field>
          <Field label="Email *" hint="Te mandamos la confirmación del registro"><Input name="contacto_email" type="email" required defaultValue={x.contacto_email ?? ''} /></Field>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-xl font-bold">Para el festival</h2>
          <Field label="Medios de pago que aceptás" hint="Ej: efectivo, transferencia, Mercado Pago"><Input name="medios_pago" defaultValue={x.medios_pago ?? ''} /></Field>
          <Field label="¿Qué necesitás para tu puesto?" hint="Ej: mesa, silla, enchufe, sombra"><Textarea name="necesidades" rows={2} defaultValue={x.necesidades ?? ''} /></Field>
          <Field label="Comentarios"><Textarea name="comentarios" rows={2} defaultValue={x.comentarios ?? ''} /></Field>
        </Card>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Tus productos</h2>
          <p className="text-bosque/80">Los que quieras mostrar en la Guía de regalos. Podés sumar hasta 30.</p>
          {prods.map((p, i) => (
            <Card key={p.id ?? `n${i}`} className="space-y-2 !p-4">
              <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
                <Input placeholder="Nombre del producto" value={p.nombre} onChange={(e) => setP(i, 'nombre', e.target.value)} aria-label="Nombre del producto" />
                <Input placeholder="Precio ($)" inputMode="numeric" value={p.precio ?? ''} onChange={(e) => setP(i, 'precio', e.target.value)} aria-label="Precio" />
              </div>
              <Textarea rows={2} placeholder="Descripción corta" value={p.descripcion ?? ''} onChange={(e) => setP(i, 'descripcion', e.target.value)} aria-label="Descripción" />
              <fieldset className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
                <legend className="sr-only">Disponibilidad</legend>
                {([['disp_previa', 'Antes del festival'], ['disp_festival', 'En el festival'], ['disp_post', 'Después']] as const).map(([k, t]) => (
                  <label key={k} className="flex items-center gap-2"><input type="checkbox" className="size-5 accent-bosque" checked={p[k]} onChange={(e) => setP(i, k, e.target.checked)} /> {t}</label>
                ))}
              </fieldset>
              <div className="flex flex-wrap items-center gap-2">
                {p.foto_path && <img src={urlPublica('productos', p.foto_path)} alt="" className="size-14 rounded-xl object-cover" />}
                <label className="cursor-pointer rounded-2xl bg-secundario/60 px-3 py-2 text-sm font-bold">
                  {subiendo === `p${i}` ? 'Subiendo…' : p.foto_path ? 'Cambiar foto' : 'Foto'}
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => subirFoto(i, e)} />
                </label>
                <button type="button" className="ml-auto text-sm font-bold text-error underline" onClick={() => setProds(prods.filter((_, j) => j !== i))}>Quitar</button>
              </div>
            </Card>
          ))}
          {prods.length < 30 && <Button type="button" variante="suave" onClick={() => setProds([...prods, nuevoProd()])}>+ Agregar producto</Button>}
        </section>

        {error && <Alerta tipo="error">{error}</Alerta>}
        <Button grande disabled={estado === 'guardando' || !!subiendo}>{estado === 'guardando' ? 'Guardando…' : 'Guardar registro'}</Button>
      </form>
    </div>
  )
}
