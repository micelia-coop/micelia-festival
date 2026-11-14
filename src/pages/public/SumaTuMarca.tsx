import { useState, type FormEvent } from 'react'
import { Alerta, Button, Card, Field, Input, Textarea, Titulo } from '../../components/ui'
import { rpc } from '../../lib/supabase'

export default function SumaTuMarca() {
  const [ok, setOk] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setEnviando(true); setError('')
    try {
      await rpc('postular_marca', {
        p_nombre: f.get('nombre'), p_rubro: f.get('rubro'), p_descripcion: f.get('descripcion'),
        p_instagram: f.get('instagram'), p_whatsapp: f.get('whatsapp'), p_web: f.get('web'),
        p_contacto: f.get('contacto'), p_mensaje: f.get('mensaje'),
      })
      setOk(true)
    } catch (err) { setError((err as Error).message) }
    setEnviando(false)
  }

  return (
    <div className="mx-auto max-w-xl">
      <Titulo bajada="¿Tenés una marca emprendedora? Postulate para estar en el festival y en la Guía de regalos conscientes.">Sumá tu marca</Titulo>
      {ok ? (
        <Card><h2 className="text-2xl font-bold">¡Gracias! 🌿</h2><p className="mt-2">Recibimos tu postulación. El equipo de Alianzas te va a escribir.</p></Card>
      ) : (
        <Card>
          <form onSubmit={enviar} className="space-y-3">
            <Field label="Nombre de la marca"><Input name="nombre" required /></Field>
            <Field label="Rubro" hint="Ej: cosmética natural, textil, cerámica, gastronomía"><Input name="rubro" required /></Field>
            <Field label="Contanos qué hacés"><Textarea name="descripcion" required /></Field>
            <Field label="Instagram"><Input name="instagram" placeholder="@tumarca" /></Field>
            <Field label="WhatsApp de la marca" hint="Es el que va a figurar en la guía para recibir pedidos"><Input name="whatsapp" type="tel" /></Field>
            <Field label="Web (opcional)"><Input name="web" /></Field>
            <Field label="Persona de contacto" hint="Nombre y WhatsApp o email (no se publica)"><Input name="contacto" required /></Field>
            <Field label="¿Algo más que quieras contarnos?"><Textarea name="mensaje" /></Field>
            {error && <Alerta tipo="error">{error}</Alerta>}
            <Button grande disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar postulación'}</Button>
          </form>
        </Card>
      )}
    </div>
  )
}
