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

export function MetodoPago({ valor, onChange }: { valor: string; onChange: (v: 'transferencia' | 'efectivo') => void }) {
  const op = (v: 'transferencia' | 'efectivo', titulo: string, texto: string) => (
    <label className={`flex cursor-pointer gap-3 rounded-2xl p-4 ring-2 ${valor === v ? 'bg-secundario/40 ring-bosque' : 'ring-secundario'}`}>
      <input type="radio" name="metodo" value={v} checked={valor === v} onChange={() => onChange(v)} className="mt-1 size-5 accent-bosque" />
      <span><strong className="block">{titulo}</strong><span className="text-sm text-bosque/80">{texto}</span></span>
    </label>
  )
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-bold">¿Cómo pagás?</legend>
      {op('transferencia', 'Transferencia', 'Transferís al alias de Micelia y subís el comprobante. Cuando lo validamos, se activa.')}
    </fieldset>
  )
}
