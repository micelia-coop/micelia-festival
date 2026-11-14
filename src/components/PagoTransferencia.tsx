import { useState, type ChangeEvent } from 'react'
import { pesos } from '../lib/format'
import { rpc, supabase } from '../lib/supabase'
import type { Pago } from '../lib/types'
import { Alerta, Button } from './ui'

function Copiable({ etiqueta, valor }: { etiqueta: string; valor?: string | null }) {
  const [ok, setOk] = useState(false)
  if (!valor) return null
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl bg-fondo px-4 py-3">
      <div className="min-w-0"><p className="text-xs font-bold uppercase text-bosque/70">{etiqueta}</p><p className="break-all text-lg font-bold">{valor}</p></div>
      <Button type="button" variante="suave" className="shrink-0 !px-3 !py-2 text-sm"
        onClick={() => navigator.clipboard?.writeText(valor).then(() => { setOk(true); setTimeout(() => setOk(false), 1500) })}>
        {ok ? '¡Copiado!' : 'Copiar'}
      </Button>
    </div>
  )
}

export default function PagoTransferencia({ token, codigo, total, pago, yaSubido, onSubido }:
  { token: string; codigo: string; total: number; pago: Pago; yaSubido: boolean; onSubido: () => void }) {
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')

  async function subir(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) { setError('El archivo es muy grande (máximo 8 MB).'); return }
    setSubiendo(true); setError('')
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const path = `${token}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('comprobantes').upload(path, file, { contentType: file.type || undefined })
    if (upErr) { setError('No pudimos subir el archivo. Probá con una captura de pantalla (JPG o PNG).'); setSubiendo(false); return }
    try { await rpc('registrar_comprobante', { p_token: token, p_path: path }); onSubido() }
    catch (err) { setError((err as Error).message) }
    setSubiendo(false)
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">1 · Transferí {pesos(total)}</h2>
      {pago.alias || pago.cvu ? (
        <div className="space-y-2">
          <Copiable etiqueta="Alias" valor={pago.alias} />
          <Copiable etiqueta="CVU" valor={pago.cvu} />
          {pago.titular && <p className="text-sm">Titular: <strong>{pago.titular}</strong>{pago.billetera ? ` · ${pago.billetera}` : ''}</p>}
          <Copiable etiqueta="En el concepto o referencia poné" valor={codigo} />
        </div>
      ) : <Alerta tipo="alerta">Todavía no cargamos el alias de pago. Escribinos por WhatsApp y te lo pasamos.</Alerta>}

      <h2 className="pt-2 text-xl font-bold">2 · Subí el comprobante</h2>
      {yaSubido && <Alerta tipo="exito">Recibimos tu comprobante. Te avisamos por WhatsApp cuando lo validemos.</Alerta>}
      <label className={`flex w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-bosque px-4 py-5 text-center font-bold ${subiendo ? 'opacity-50' : ''}`}>
        <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={subir} disabled={subiendo} />
        {subiendo ? 'Subiendo…' : yaSubido ? 'Subir otro comprobante' : '📎 Elegir captura o PDF'}
      </label>
      {error && <Alerta tipo="error">{error}</Alerta>}
    </div>
  )
}
