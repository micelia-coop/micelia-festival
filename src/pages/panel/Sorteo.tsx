import { useEffect, useState } from 'react'
import { Alerta, Button, Card, Input } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { hora } from '../../lib/format'
import { rpc, supabase } from '../../lib/supabase'

type Ganador = { id: string; numero: number; titular: string; premio: string | null; at: string }
type Estado = { participantes: number; ganadores: Ganador[] }
const n3 = (n: number) => String(n).padStart(3, '0')

export default function Sorteo() {
  const { puede } = useAuth()
  const [est, setEst] = useState<Estado | null>(null)
  const [premio, setPremio] = useState('')
  const [girando, setGirando] = useState<number | null>(null)
  const [ganador, setGanador] = useState<{ numero: number; titular: string; premio?: string } | null>(null)
  const [msg, setMsg] = useState('')
  const cargar = () => rpc<Estado>('sorteo_estado').then(setEst).catch((e) => setMsg(e.message))
  useEffect(() => { cargar() }, [])

  async function sortear() {
    setMsg(''); setGanador(null)
    const t = setInterval(() => setGirando(1 + Math.floor(Math.random() * Math.max(est?.participantes ?? 99, 99))), 70)
    try {
      const [r] = await Promise.all([rpc<{ ok: boolean; mensaje?: string; numero: number; titular: string; premio?: string }>('sortear', { p_premio: premio }), new Promise((ok) => setTimeout(ok, 2200))])
      clearInterval(t); setGirando(null)
      if (!r.ok) setMsg(r.mensaje ?? 'No se pudo sortear.')
      else { setGanador(r); setPremio(''); cargar() }
    } catch (e) { clearInterval(t); setGirando(null); setMsg((e as Error).message) }
  }

  async function quitar(g: Ganador) {
    if (!confirm(`¿Quitar a ${g.titular} (N° ${n3(g.numero)}) de la lista de ganadoras? Vuelve a participar.`)) return
    await supabase.from('sorteo_ganadores').delete().eq('id', g.id); cargar()
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="text-3xl font-bold">🎲 Sorteo</h1>
      <p>Participan quienes <strong>ingresaron al festival</strong> (escaneadas en la puerta): <strong>{est?.participantes ?? '…'}</strong> personas.</p>
      {puede('admin') && (
        <Card className="space-y-3">
          <Input placeholder="Premio (opcional), ej: Bolsa Ritual" value={premio} onChange={(e) => setPremio(e.target.value)} aria-label="Premio" />
          <Button grande disabled={girando != null} onClick={sortear}>{girando != null ? 'Sorteando…' : 'Sortear'}</Button>
        </Card>
      )}
      {girando != null && <p className="text-center font-display text-7xl font-bold">N° {n3(girando)}</p>}
      {ganador && (
        <div className="rounded-3xl bg-bosque p-8 text-center text-crema">
          <p className="text-lg font-bold text-tierra">{ganador.premio ? `Ganadora de: ${ganador.premio}` : '¡Tenemos ganadora!'}</p>
          <p className="font-display text-7xl font-bold">N° {n3(ganador.numero)}</p>
          <p className="mt-2 text-2xl">{ganador.titular}</p>
        </div>
      )}
      {msg && <Alerta tipo="error">{msg}</Alerta>}
      {!!est?.ganadores.length && (
        <Card>
          <h2 className="mb-2 text-xl font-bold">Ganadoras</h2>
          <ul className="divide-y divide-secundario/60">
            {est.ganadores.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-2 py-2">
                <span><strong>N° {n3(g.numero)}</strong> · {g.titular}{g.premio ? ` · ${g.premio}` : ''} <span className="text-xs text-bosque/60">{hora(g.at)}</span></span>
                {puede('admin') && <button className="text-sm font-bold text-error underline" onClick={() => quitar(g)}>Quitar</button>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
