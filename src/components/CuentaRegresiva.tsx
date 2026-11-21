import { useEffect, useState } from 'react'

export default function CuentaRegresiva({ hasta, sinMinutos }: { hasta: string; sinMinutos?: boolean }) {
  const [ahora, setAhora] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setAhora(Date.now()), 60_000); return () => clearInterval(t) }, [])
  const ms = new Date(hasta).getTime() - ahora
  if (ms <= 0) return null
  const dias = Math.floor(ms / 86_400_000)
  const horas = Math.floor((ms % 86_400_000) / 3_600_000)
  const min = Math.floor((ms % 3_600_000) / 60_000)
  const caja = (n: number, l: string) => (
    <div className="min-w-16 rounded-2xl bg-white/10 px-3 py-2 text-center">
      <div className="font-display text-3xl font-bold">{n}</div>
      <div className="text-xs uppercase tracking-wide text-tierra">{l}</div>
    </div>
  )
  return (
    <div className="flex gap-2" aria-label={`Faltan ${dias} días y ${horas} horas`}>
      {caja(dias, 'días')}{caja(horas, 'horas')}{!sinMinutos && caja(min, 'min')}
    </div>
  )
}
