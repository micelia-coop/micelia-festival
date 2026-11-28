import { useEffect, useState } from 'react'
import Escaner from '../../components/Escaner'
import { Button, Card } from '../../components/ui'
import { hora } from '../../lib/format'
import { rpc } from '../../lib/supabase'

type Res = {
  resultado: 'ok' | 'ya_ingreso' | 'no_valida' | 'temprano' | 'disponible' | 'marcado' | 'usado' | 'no_aplica'
  mensaje?: string; titular?: string; tipo?: string; numero?: number; codigo?: string; ingreso_at?: string; pct?: number; forzado?: boolean
}
const COLOR: Record<Res['resultado'], string> = {
  ok: 'var(--color-exito)', marcado: 'var(--color-exito)', disponible: 'var(--color-exito)',
  ya_ingreso: 'var(--color-alerta)', temprano: 'var(--color-alerta)', usado: 'var(--color-alerta)',
  no_valida: 'var(--color-error)', no_aplica: 'var(--color-error)',
}

export default function Puerta() {
  const [modo, setModo] = useState<'ingreso' | 'bolsa'>('ingreso')
  const [res, setRes] = useState<Res | null>(null)
  const [ultimo, setUltimo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const [adentro, setAdentro] = useState<number | null>(null)

  const contar = () => rpc<{ participantes: number }>('sorteo_estado').then((d) => setAdentro(d.participantes)).catch(() => {})
  useEffect(() => { contar() }, [])

  async function leer(codigo: string, opciones: { forzar?: boolean; marcar?: boolean } = {}) {
    setOcupado(true); setError(''); setUltimo(codigo)
    try {
      const r = modo === 'ingreso'
        ? await rpc<Res>('registrar_ingreso', { p_codigo: codigo, p_forzar: !!opciones.forzar })
        : await rpc<Res>('descuento_bolsa_festival', { p_codigo: codigo, p_marcar: !!opciones.marcar })
      setRes(r)
      if (r.resultado === 'ok') { navigator.vibrate?.(120); contar() }
    } catch (e) { setError((e as Error).message) }
    setOcupado(false)
  }

  const titulo = (r: Res) => ({
    ok: `Bienvenida${r.titular ? ', ' + r.titular.split(' ')[0] : ''} 🌿`, ya_ingreso: 'Ya ingresó', no_valida: 'Entrada no válida',
    temprano: 'Todavía no es su horario', disponible: `Descuento disponible: ${r.pct}%`, marcado: `Descuento aplicado: ${r.pct}% ✓`,
    usado: 'Ya usó su descuento', no_aplica: 'Sin descuento',
  }[r.resultado])

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secundario/50 p-1" role="tablist">
        {([['ingreso', '🚪 Ingreso'], ['bolsa', '🎁 Descuento Bolsa']] as const).map(([m, t]) => (
          <button key={m} role="tab" aria-selected={modo === m} onClick={() => { setModo(m); setRes(null) }}
            className={`rounded-xl py-3 font-bold ${modo === m ? 'bg-bosque text-white' : ''}`}>{t}</button>
        ))}
      </div>
      {modo === 'ingreso' && adentro != null && <p className="text-center font-bold">Ingresaron: {adentro}</p>}

      {res && (
        <div className="space-y-3 rounded-3xl p-6 text-center text-white" style={{ background: COLOR[res.resultado] }} role="status" aria-live="assertive">
          <p className="text-3xl font-bold">{titulo(res)}</p>
          {res.titular && <p className="text-xl">{res.titular}</p>}
          {(res.tipo || res.numero) && <p className="text-lg font-bold">{res.tipo}{res.numero ? ` · N° ${String(res.numero).padStart(3, '0')}` : ''}</p>}
          {res.resultado === 'ya_ingreso' && res.ingreso_at && <p className="text-lg">Ingresó a las {hora(res.ingreso_at)}</p>}
          {res.mensaje && <p className="text-lg">{res.mensaje}</p>}
          {res.resultado === 'temprano' && <Button variante="borde" className="!border-white !text-white" onClick={() => leer(ultimo, { forzar: true })}>Dejar pasar igual</Button>}
          {res.resultado === 'disponible' && <Button grande variante="borde" className="!border-white !bg-white !text-bosque" onClick={() => leer(ultimo, { marcar: true })}>Marcar descuento como usado</Button>}
        </div>
      )}
      {error && <p className="rounded-2xl bg-error px-4 py-3 font-bold text-white">{error}</p>}

      <Card><Escaner onLeer={(t) => leer(t)} ocupado={ocupado} /></Card>
      <p className="text-center text-sm text-bosque/70">
        {modo === 'ingreso' ? 'La entrada de la mañana entra a la mañana y a la tarde. La de la tarde, desde su horario.' : 'Solo la entrada de la tarde tiene descuento en la bolsa. Se usa una sola vez.'}
      </p>
    </div>
  )
}
