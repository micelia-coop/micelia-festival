import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alerta, Button, Card, Field, Input, Select, Textarea, Titulo } from '../../components/ui'
import { useConfig } from '../../lib/config'
import { lineas, propuestaCompleta } from '../../lib/propuesta'
import { rpc } from '../../lib/supabase'

export const NIVELES_SLUG = ['semilla', 'raiz', 'copa'] as const
const EMOJI = ['🌱', '🌿', '🌳']
const COLOR = ['var(--color-lavanda)', 'var(--color-arcilla)', 'var(--color-bosque)']

export default function PostularNivel() {
  const { nivel: slug = '' } = useParams()
  const { config } = useConfig()
  const i = NIVELES_SLUG.indexOf(slug as (typeof NIVELES_SLUG)[number])
  const p = propuestaCompleta(config.propuesta)
  const [ok, setOk] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  if (i < 0) return <Alerta tipo="error">Este formulario no existe. Revisá el link o mirá la <Link to="/marcas-aliadas" className="underline">propuesta</Link>.</Alerta>
  const n = p.niveles[i]
  const compromisos = lineas(n.aportas).filter((x) => !/^opcional/i.test(x))

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const g = (k: string) => String(f.get(k) ?? '').trim()
    const respuestas: [string, string][] = [
      ['Premio o regalo para el sorteo', g('premio')],
      ['Actividad o taller', g('actividad_titulo')],
      ['De qué se trata', g('actividad_desc')],
      ['Duración', g('duracion')],
      ['Necesita para la actividad', g('actividad_necesita')],
      ['Ofrece en el stand', g('stand_ofrece')],
      ['Electricidad', g('electricidad')],
      ['Ofrecería para el canje de la entrada', g('canje')],
      ['Comentarios', g('comentarios')],
    ]
    const mensaje = [
      `Nivel: ${n.nombre}`,
      'Origen: formulario de nivel (invitación de Alianzas)',
      `Se compromete a: ${compromisos.join(' · ')}`,
      ...respuestas.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
    ].join('\n')
    setEnviando(true); setError('')
    try {
      await rpc('postular_marca', {
        p_nombre: g('nombre'), p_rubro: g('rubro'), p_descripcion: g('descripcion'),
        p_instagram: g('instagram'), p_whatsapp: g('contacto_whatsapp'), p_web: g('web'),
        p_contacto: [g('contacto_nombre'), g('contacto_whatsapp'), g('contacto_email')].filter(Boolean).join(' · '),
        p_mensaje: mensaje,
      })
      setOk(true); window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) { setError((err as Error).message) }
    setEnviando(false)
  }

  if (ok) return (
    <Card className="mx-auto max-w-xl" acento={COLOR[i]}>
      <h1 className="text-2xl font-bold">¡Gracias por sumarte como {n.nombre}! {EMOJI[i]}</h1>
      <p className="mt-2">Recibimos tus datos. El equipo de Alianzas de Micelia te escribe para coordinar los próximos pasos.</p>
    </Card>
  )

  return (
    <div className="mx-auto max-w-xl">
      <Titulo acento={COLOR[i]} bajada={<>Completá tus datos para sumarte al Festival de Solsticio. <Link to="/marcas-aliadas" className="font-bold underline">Ver la propuesta completa</Link></>}>
        {EMOJI[i]} Nivel {n.nombre}
      </Titulo>

      <Card className="mb-5 space-y-3" acento={COLOR[i]}>
        <div><p className="text-xs font-bold uppercase tracking-wide text-bosque/60">Aportás</p>
          <ul className="mt-1 space-y-1">{lineas(n.aportas).map((x) => <li key={x}>• {x}</li>)}</ul></div>
        <div><p className="text-xs font-bold uppercase tracking-wide text-bosque/60">Recibís de Micelia</p>
          <ul className="mt-1 space-y-1">{lineas(n.recibis).map((x) => <li key={x}>✓ {x}</li>)}</ul></div>
        {n.nota && <p className="rounded-2xl bg-alerta/20 px-3 py-2 text-sm font-semibold">⏰ {n.nota}</p>}
      </Card>

      <form onSubmit={enviar} className="space-y-5">
        <Card className="space-y-3">
          <h2 className="text-xl font-bold">Tu marca o proyecto</h2>
          <Field label="Nombre *"><Input name="nombre" required /></Field>
          <Field label="Rubro" hint="Ej: cosmética natural, música, gastronomía, bienestar"><Input name="rubro" /></Field>
          <Field label="Contanos en pocas palabras qué hacés *"><Textarea name="descripcion" required /></Field>
          <Field label="Instagram"><Input name="instagram" placeholder="@tumarca" autoCapitalize="none" /></Field>
          <Field label="Web (opcional)"><Input name="web" /></Field>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-xl font-bold">Persona de contacto</h2>
          <Field label="Nombre *"><Input name="contacto_nombre" required autoComplete="name" /></Field>
          <Field label="WhatsApp *"><Input name="contacto_whatsapp" type="tel" required autoComplete="tel" /></Field>
          <Field label="Email *"><Input name="contacto_email" type="email" required autoComplete="email" /></Field>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-xl font-bold">Tu participación</h2>
          {i === 0 && <Field label="¿Qué premio o regalo aportás para el sorteo? *"><Textarea name="premio" required rows={2} /></Field>}
          {i === 1 && <>
            <Field label="Nombre de la actividad o taller *"><Input name="actividad_titulo" required /></Field>
            <Field label="¿De qué se trata? *"><Textarea name="actividad_desc" required /></Field>
            <Field label="Duración">
              <Select name="duracion" defaultValue="1 hora"><option>30 minutos</option><option>45 minutos</option><option>1 hora</option></Select>
            </Field>
            <Field label="¿Qué necesitás para la actividad?" hint="Ej: espacio a la sombra, sillas, música, materiales"><Textarea name="actividad_necesita" rows={2} /></Field>
          </>}
          {i === 2 && <>
            <Field label="¿Qué vas a ofrecer en tu stand? *" hint="Productos o servicios y un rango de precios"><Textarea name="stand_ofrece" required /></Field>
            <Field label="¿Necesitás electricidad?">
              <Select name="electricidad" defaultValue="No"><option>No</option><option>Sí</option><option>No sé todavía</option></Select>
            </Field>
            <Field label="¿Qué ofrecerías para el canje de la entrada?" hint="La entrada de la tarde es 100% canjeable en un puesto"><Textarea name="canje" rows={2} /></Field>
          </>}
          {i > 0 && <Field label="Regalo para el sorteo (opcional)"><Input name="premio" /></Field>}
          <Field label="Comentarios"><Textarea name="comentarios" rows={2} /></Field>
        </Card>

        <Card className="space-y-2">
          <h2 className="text-xl font-bold">Compromiso</h2>
          {[...compromisos, ...(n.nota ? [n.nota] : [])].map((c) => (
            <label key={c} className="flex gap-3"><input type="checkbox" required className="mt-1 size-5 shrink-0 accent-bosque" /><span>Me comprometo a: <strong>{c}</strong></span></label>
          ))}
        </Card>

        {error && <Alerta tipo="error">{error}</Alerta>}
        <Button grande disabled={enviando}>{enviando ? 'Enviando…' : `Sumarme como ${n.nombre}`}</Button>
      </form>
    </div>
  )
}
