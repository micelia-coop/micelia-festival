import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Alerta, Button, Card, Field, Input, Textarea, Titulo } from '../../components/ui'
import { rpc } from '../../lib/supabase'
import { useConfig } from '../../lib/config'
import { lineas, propuestaCompleta } from '../../lib/propuesta'

export default function SumaTuMarca() {
  const [ok, setOk] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [nivel, setNivel] = useState('')
  const { config } = useConfig()
  const niveles = propuestaCompleta(config.propuesta).niveles

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setEnviando(true); setError('')
    try {
      await rpc('postular_marca', {
        p_nombre: f.get('nombre'), p_rubro: f.get('rubro'), p_descripcion: f.get('descripcion'),
        p_instagram: f.get('instagram'), p_whatsapp: f.get('whatsapp'), p_web: f.get('web'),
        p_contacto: [f.get('contacto_nombre'), f.get('contacto_whatsapp'), f.get('contacto_email')].map((x) => String(x ?? '').trim()).filter(Boolean).join(' · '),
        p_mensaje: [`Nivel: ${nivel || 'a definir'}`, f.get('actividad') ? `Actividad/taller: ${f.get('actividad')}` : '', String(f.get('mensaje') ?? '')].filter(Boolean).join('\n'),
      })
      setOk(true)
    } catch (err) { setError((err as Error).message) }
    setEnviando(false)
  }

  return (
    <div className="mx-auto max-w-xl">
      <Titulo bajada={<>Postulate para ser parte del Festival de Solsticio. Si todavía no la leíste, mirá la <Link to="/marcas-aliadas" className="font-bold underline">propuesta con los niveles</Link>.</>}>Postularme</Titulo>
      {ok ? (
        <Card><h2 className="text-2xl font-bold">¡Gracias! 🌿</h2><p className="mt-2">Recibimos tu postulación. El equipo de Alianzas te va a escribir.</p></Card>
      ) : (
        <Card>
          <form onSubmit={enviar} className="space-y-3">
            <Field label="Nombre de la marca"><Input name="nombre" required /></Field>
            <Field label="Rubro" hint="Ej: cosmética natural, textil, cerámica, gastronomía"><Input name="rubro" required /></Field>
            <Field label="Contanos qué hacés"><Textarea name="descripcion" required /></Field>
            <Field label="Instagram"><Input name="instagram" placeholder="@tumarca" /></Field>
            <Field label="WhatsApp de la marca (opcional)" hint="Si es distinto al tuyo; es el que figuraría en la guía para recibir pedidos"><Input name="whatsapp" type="tel" /></Field>
            <Field label="Web (opcional)"><Input name="web" /></Field>
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-bold">¿Qué nivel te interesa?</legend>
              {[...niveles.map((n, i) => [n.nombre, `${['🌱', '🌿', '🌳'][i]} ${n.nombre} · ${lineas(n.aportas).slice(0, 2).join(' + ')}`]),
                ['A definir', 'Todavía no sé, quiero conversarlo']].map(([v, t]) => (
                <label key={v} className={`flex cursor-pointer gap-3 rounded-2xl p-3 ring-2 ${nivel === v ? 'bg-secundario/40 ring-bosque' : 'ring-secundario'}`}>
                  <input type="radio" name="nivel" required checked={nivel === v} onChange={() => setNivel(v)} className="mt-1 size-5 accent-bosque" />
                  <span className="font-semibold">{t}</span>
                </label>
              ))}
            </fieldset>
            {nivel === niveles[1]?.nombre && <Field label="¿Qué actividad o taller propondrías?" hint="Máximo 1 hora"><Textarea name="actividad" rows={2} /></Field>}
            <Field label="Tu nombre (persona de contacto)" hint="No se publica"><Input name="contacto_nombre" required autoComplete="name" /></Field>
            <Field label="Tu WhatsApp" hint="No se publica"><Input name="contacto_whatsapp" type="tel" required autoComplete="tel" /></Field>
            <Field label="Tu email" hint="No se publica"><Input name="contacto_email" type="email" autoComplete="email" /></Field>
            <Field label="¿Algo más que quieras contarnos?"><Textarea name="mensaje" /></Field>
            {error && <Alerta tipo="error">{error}</Alerta>}
            <Button grande disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar postulación'}</Button>
          </form>
        </Card>
      )}
    </div>
  )
}
