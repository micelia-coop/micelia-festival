import { Field, Input } from './ui'

export function DatosComprador() {
  return (
    <div className="space-y-3">
      <Field label="Tu nombre y apellido"><Input name="nombre" required autoComplete="name" /></Field>
      <Field label="WhatsApp" hint="Te mandamos tu entrada o tu pedido por acá. Con código de área.">
        <Input name="whatsapp" type="tel" required autoComplete="tel" placeholder="261 555 1234" />
      </Field>
      <Field label="Email" hint="Te mandamos la confirmación y tu entrada por mail"><Input name="email" type="email" required autoComplete="email" /></Field>
      <Field label="Usuario de Instagram (opcional)"><Input name="instagram" placeholder="@tuusuario" autoCapitalize="none" autoCorrect="off" /></Field>
    </div>
  )
}

export type Metodo = 'mercadopago' | 'transferencia'

export function MetodoPago({ valor, onChange, conMP }: { valor: string; onChange: (v: Metodo) => void; conMP?: boolean }) {
  const op = (v: Metodo, titulo: string, texto: string) => (
    <label className={`flex cursor-pointer gap-3 rounded-2xl p-4 ring-2 ${valor === v ? 'bg-secundario/40 ring-bosque' : 'ring-secundario'}`}>
      <input type="radio" name="metodo" value={v} checked={valor === v} onChange={() => onChange(v)} className="mt-1 size-5 accent-bosque" />
      <span><strong className="block">{titulo}</strong><span className="text-sm text-bosque/80">{texto}</span></span>
    </label>
  )
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-bold">¿Cómo pagás?</legend>
      {conMP && op('mercadopago', 'Mercado Pago', 'Tarjeta de crédito o débito, o dinero en cuenta. Tu entrada se activa apenas se aprueba el pago.')}
      {op('transferencia', 'Transferencia (sin recargo)', 'Transferís al alias de Micelia y subís el comprobante. Cuando lo validamos, se activa.')}
    </fieldset>
  )
}

/** Pide a Mercado Pago el link de pago del pedido y redirige. Devuelve un mensaje de error si falla. */
export async function irAMercadoPago(token: string): Promise<string | null> {
  const { supabase } = await import('../lib/supabase')
  const { data, error } = await supabase.functions.invoke('mp-preferencia', { body: { token } })
  if (error || !data) return 'No pudimos conectar con Mercado Pago. Probá de nuevo desde tu pedido.'
  if (data.pagado) return null
  if (data.error) return data.error
  if (data.url) { window.location.href = data.url; return null }
  return 'No pudimos conectar con Mercado Pago.'
}
