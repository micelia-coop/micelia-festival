import { useEffect, useState, type FormEvent } from 'react'
import { Alerta, Button, Card, Field, Input, Select, Titulo } from '../../components/ui'
import { useConfig } from '../../lib/config'
import { diaLocal, fechaCorta } from '../../lib/format'
import { rpc } from '../../lib/supabase'

type Dia = { dia: number; fecha: string; habilitado: boolean; titulo: string | null; descripcion: string | null; youtube_url: string | null }

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/)
  return m ? m[1] : null
}

export default function Desafio() {
  const { config } = useConfig()
  const d = config.desafio
  const [dias, setDias] = useState<Dia[]>([])
  const [abierto, setAbierto] = useState<number | null>(null)

  useEffect(() => { rpc<Dia[]>('desafio_grilla').then(setDias).catch(() => {}) }, [])

  return (
    <div className="space-y-8">
      <Titulo acento="var(--color-lavanda)" bajada={d.bajada}>{d.titulo ?? 'Desafío de Gratitud · 21 días'}</Titulo>
      <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <Inscripcion consentimiento={d.consentimiento} gestiona={d.gestiona}
          canalUrl={d.canal_url ?? 'https://t.me/miceliacomunidad/85'} canalTexto={d.canal_texto ?? 'Sumate al Canal de Respira y Transfórmate'} />
        <section>
          <h2 className="mb-3 text-2xl font-bold">Los 21 días</h2>
          <ol className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {dias.map((x) => (
              <li key={x.dia}>
                <button disabled={!x.habilitado} onClick={() => setAbierto(abierto === x.dia ? null : x.dia)}
                  className={`w-full rounded-2xl p-3 text-left ${x.habilitado ? 'bg-lavanda text-bosque' : 'bg-white/60 text-bosque/60 ring-1 ring-secundario'}`}
                  aria-label={x.habilitado ? `Día ${x.dia}: ver video` : `Día ${x.dia}: se habilita el ${fechaCorta(diaLocal(x.fecha))}`}>
                  <span className="block font-display text-2xl font-bold">{x.dia}</span>
                  <span className="text-xs font-bold">{x.habilitado ? '▶ Ver' : `🔒 ${fechaCorta(diaLocal(x.fecha))}`}</span>
                </button>
              </li>
            ))}
          </ol>
          {abierto && (() => {
            const x = dias.find((y) => y.dia === abierto)!
            const id = x.youtube_url ? youtubeId(x.youtube_url) : null
            return (
              <Card className="mt-4" acento="var(--color-lavanda)">
                <h3 className="text-xl font-bold">Día {x.dia}{x.titulo ? ` · ${x.titulo}` : ''}</h3>
                {x.descripcion && <p className="mt-1 text-bosque/80">{x.descripcion}</p>}
                {id ? (
                  <div className="mt-3 aspect-video overflow-hidden rounded-2xl">
                    <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${id}`}
                      title={`Video del día ${x.dia}`} allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />
                  </div>
                ) : x.youtube_url ? (
                  <a className="mt-3 inline-block font-bold underline" href={x.youtube_url} target="_blank" rel="noreferrer">Ver el video</a>
                ) : <p className="mt-2">El video se carga muy pronto.</p>}
              </Card>
            )
          })()}
        </section>
      </div>
    </div>
  )
}

function Inscripcion({ consentimiento, gestiona, canalUrl, canalTexto }: { consentimiento?: string; gestiona?: string; canalUrl?: string; canalTexto?: string }) {
  const [estado, setEstado] = useState<'form' | 'enviando' | 'ok' | 'ya'>('form')
  const [error, setError] = useState('')
  const [como, setComo] = useState('')

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setEstado('enviando'); setError('')
    try {
      const r = await rpc<{ ya_inscripta: boolean }>('inscribir_desafio', {
        p_nombre: f.get('nombre'), p_email: f.get('email'), p_whatsapp: f.get('whatsapp'),
        p_ciudad: f.get('ciudad'),
        p_como_se_entero: como === 'Otro' ? `Otro: ${String(f.get('como_otro') ?? '').trim()}` : como, p_acepta: f.get('acepta') === 'on',
        p_instagram: f.get('instagram'),
      })
      setEstado(r.ya_inscripta ? 'ya' : 'ok')
    } catch (err) { setError((err as Error).message); setEstado('form') }
  }

  if (estado === 'ok' || estado === 'ya') return (
    <Card acento="var(--color-lavanda)">
      <h2 className="text-2xl font-bold">{estado === 'ok' ? '¡Ya sos parte! 💜' : 'Ya estabas inscripta 💜'}</h2>
      <p className="mt-2">Cada día se habilita un video nuevo en esta página. Te vamos a ir avisando por Telegram y email.</p>
      {canalUrl && (
        <a href={canalUrl} target="_blank" rel="noreferrer"
          className="mt-4 inline-flex items-center justify-center rounded-2xl bg-lavanda px-5 py-3 font-bold text-bosque">
          {canalTexto} →
        </a>
      )}
    </Card>
  )

  return (
    <Card acento="var(--color-lavanda)">
      <h2 className="mb-1 text-2xl font-bold">Inscribite gratis</h2>
      <p className="mb-4 text-sm text-bosque/80">Lo gestiona {gestiona ?? 'Respira y Transfórmate'} junto con Micelia.</p>
      <form onSubmit={enviar} className="space-y-3">
        <Field label="Nombre"><Input name="nombre" required autoComplete="name" /></Field>
        <Field label="Email"><Input name="email" type="email" required autoComplete="email" /></Field>
        <Field label="WhatsApp" hint="Con código de área, ej. 261 555 1234"><Input name="whatsapp" type="tel" required autoComplete="tel" /></Field>
        <Field label="Usuario de Instagram (opcional)"><Input name="instagram" placeholder="@tuusuario" autoCapitalize="none" autoCorrect="off" /></Field>
        <Field label="Ciudad (opcional)"><Input name="ciudad" /></Field>
        <Field label="¿Cómo te enteraste? (opcional)">
          <Select name="como" value={como} onChange={(e) => setComo(e.target.value)}>
            <option value="">Elegí una opción</option>
            <option>Instagram</option><option>Telegram</option><option>WhatsApp</option>
            <option>Una amiga</option><option>Respira y Transfórmate</option><option>Otro</option>
          </Select>
        </Field>
        {como === 'Otro' && (
          <Field label="¿Cuál?"><Input name="como_otro" required autoFocus placeholder="Contanos cómo te enteraste" maxLength={120} /></Field>
        )}
        <label className="flex gap-3 text-sm">
          <input type="checkbox" name="acepta" required className="mt-1 size-5 shrink-0 accent-bosque" />
          <span>{consentimiento}</span>
        </label>
        {error && <Alerta tipo="error">{error}</Alerta>}
        <Button grande disabled={estado === 'enviando'}>{estado === 'enviando' ? 'Enviando…' : 'Quiero sumarme'}</Button>
      </form>
    </Card>
  )
}
