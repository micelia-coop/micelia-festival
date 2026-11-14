import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import QrCode from '../../components/QrCode'
import { Alerta, Spinner } from '../../components/ui'
import { useConfig } from '../../lib/config'
import { diaLocal, fechaLarga, hora, pesos } from '../../lib/format'
import { rpc } from '../../lib/supabase'
import type { EntradaPublica } from '../../lib/types'
import { origen } from '../../lib/whatsapp'

export default function MiEntrada() {
  const { token = '' } = useParams()
  const { config } = useConfig()
  const [e, setE] = useState<EntradaPublica | null | undefined>(undefined)

  useEffect(() => { rpc<EntradaPublica | null>('ver_entrada', { p_token: token }).then(setE).catch(() => setE(null)) }, [token])

  if (e === undefined) return <Spinner />
  if (e === null) return <Alerta tipo="error">No encontramos esta entrada. Revisá el link.</Alerta>

  const anulada = ['cancelado', 'rechazado', 'vencido'].includes(e.pedido.estado)
  const estados: string[] = []
  if (anulada) estados.push('Entrada anulada')
  else if (!e.activa) estados.push('Pendiente de pago')
  else estados.push('Pagada ✓')
  if (e.ingreso_at) estados.push(`Ingresó ${hora(e.ingreso_at)}`)
  if (e.tipo.incluye_almuerzo) estados.push(e.almuerzo_at ? `Almuerzo retirado ${hora(e.almuerzo_at)}` : 'Almuerzo disponible')
  if (e.canje) estados.push(`Canjeada en ${e.canje.puesto} · ${hora(e.canje.at)}`)

  return (
    <div className="mx-auto max-w-md space-y-5 text-center">
      <div className="rounded-[2rem] bg-bosque p-6 text-crema">
        <p className="font-bold uppercase tracking-widest text-tierra">{config.festival.nombre}</p>
        <p className="capitalize">{fechaLarga(diaLocal(config.festival.fecha))}</p>
        <h1 className="mt-2 text-3xl font-bold">{e.titular_nombre}</h1>
        <p className="text-lg font-bold text-tierra">{e.tipo.nombre}</p>
        <div className="mt-4 flex justify-center"><QrCode valor={`${origen()}/e/${e.token}`} apagado={!e.activa || anulada} /></div>
        <p className="mt-3 font-mono text-3xl font-bold tracking-widest">{e.codigo_corto}</p>
        <p className="text-xs text-crema/70">Si la cámara falla, dictá este código</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {estados.map((s) => <span key={s} className="rounded-full bg-secundario px-3 py-1 text-sm font-bold">{s}</span>)}
      </div>

      {!e.activa && !anulada && <Alerta tipo="alerta">Tu entrada se activa cuando validemos el pago (pedido {e.pedido.codigo}).</Alerta>}

      <div className="space-y-2 rounded-3xl bg-superficie p-5 text-left ring-1 ring-secundario/60">
        <h2 className="text-lg font-bold">Cómo usarla</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Mostrá este QR en la puerta para registrar tu ingreso.</li>
          {e.tipo.incluye_almuerzo && <li>En La Tregua, mostralo para retirar tu almuerzo (bebida + tapeo).</li>}
          {e.tipo.valor_canje > 0
            ? <li>Canjeala <strong>entera, en un solo puesto</strong>, por algo de hasta {pesos(e.tipo.valor_canje)}. Si elegís algo más caro, pagás la diferencia al puesto.</li>
            : <li>Esta entrada no es canjeable: paga la actividad de la mañana.</li>}
          <li>Subí el brillo de la pantalla para que se lea mejor. 🌞</li>
        </ul>
      </div>
    </div>
  )
}
