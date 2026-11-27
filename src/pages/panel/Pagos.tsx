import { useEffect, useState } from 'react'
import EstadoPedido from '../../components/EstadoPedido'
import { Alerta, Button, Card, Input, Spinner } from '../../components/ui'
import { useConfig } from '../../lib/config'
import { fechaHora, pesos } from '../../lib/format'
import { rpc, supabase } from '../../lib/supabase'
import type { PedidoEstado, PedidoPublico } from '../../lib/types'
import { linkWa, origen } from '../../lib/whatsapp'

type Pend = {
  id: string; codigo: string; tipo: 'entrada' | 'bolsa'; nombre: string; email: string | null; whatsapp: string | null; instagram?: string | null
  total: number; metodo_pago: string; estado: PedidoEstado; comprobante_path: string | null; vence_at: string | null
  created_at: string; token: string; detalle: string | null
}

export default function Pagos() {
  const { config } = useConfig()
  const [lista, setLista] = useState<Pend[] | null>(null)
  const [busca, setBusca] = useState('')
  const [encontrados, setEncontrados] = useState<Pend[] | null>(null)
  const [msg, setMsg] = useState<{ tipo: 'exito' | 'error'; t: string; wa?: string } | null>(null)
  const [ocupado, setOcupado] = useState('')

  const cargar = () => rpc<Pend[]>('pagos_pendientes').then(setLista).catch((e) => setMsg({ tipo: 'error', t: e.message }))
  useEffect(() => { cargar() }, [])

  async function buscar() {
    const q = busca.trim().replace(/[,()%*\\]/g, " ")
    if (!q) { setEncontrados(null); return }
    const { data } = await supabase.from('pedidos')
      .select('id,codigo,tipo,nombre,email,whatsapp,instagram,total,metodo_pago,estado,comprobante_path,vence_at,created_at,token')
      .or(`codigo.ilike.%${q}%,nombre.ilike.%${q}%,whatsapp.ilike.%${q}%`).order('created_at', { ascending: false }).limit(30)
    setEncontrados((data as Pend[]) ?? [])
  }

  async function verComprobante(path: string) {
    const { data, error } = await supabase.storage.from('comprobantes').createSignedUrl(path, 600)
    if (error || !data) { setMsg({ tipo: 'error', t: 'No se pudo abrir el comprobante.' }); return }
    window.open(data.signedUrl, '_blank')
  }

  async function mensajeWa(p: Pend): Promise<string> {
    const det = await rpc<PedidoPublico>('ver_pedido', { p_token: p.token })
    const nom = p.nombre.split(' ')[0]
    if (p.tipo === 'entrada') {
      const links = det.entradas.map((e) => `• ${e.titular_nombre} (${e.tipo}): ${origen()}/e/${e.token}`).join('\n')
      return `¡Hola ${nom}! 🌿 Confirmamos tu pago para el ${config.festival.nombre}. ${det.entradas.length > 1 ? 'Estas son tus entradas' : 'Esta es tu entrada'}:\n${links}\n\nMostrá el QR en la puerta. ¡Nos vemos el 19/12!`
    }
    return `¡Hola ${nom}! 🌿 Confirmamos el pago de tu Bolsa Ritual (pedido ${p.codigo}). Podés seguir tu pedido acá: ${origen()}/p/${p.token}`
  }

  async function validar(p: Pend) {
    if (!confirm(`¿Confirmás que recibiste ${pesos(p.total)} de ${p.nombre} (${p.codigo})?`)) return
    setOcupado(p.id); setMsg(null)
    try {
      await rpc('validar_pago', { p_pedido_id: p.id })
      setMsg({ tipo: 'exito', t: `Pago de ${p.nombre} validado.`, wa: linkWa(p.whatsapp, await mensajeWa(p)) })
      cargar(); if (encontrados) buscar()
    } catch (e) { setMsg({ tipo: 'error', t: (e as Error).message }) }
    setOcupado('')
  }

  async function rechazar(p: Pend) {
    const motivo = prompt('Motivo del rechazo (se guarda en las notas):')
    if (motivo === null) return
    setOcupado(p.id)
    try {
      await rpc('rechazar_pago', { p_pedido_id: p.id, p_motivo: motivo })
      setMsg({ tipo: 'exito', t: `Pedido ${p.codigo} rechazado.`, wa: linkWa(p.whatsapp, `Hola ${p.nombre.split(' ')[0]}, no pudimos validar el pago de tu pedido ${p.codigo}. ¿Nos mandás el comprobante de nuevo? ${origen()}/p/${p.token}`) })
      cargar()
    } catch (e) { setMsg({ tipo: 'error', t: (e as Error).message }) }
    setOcupado('')
  }

  async function reenviar(p: Pend) { window.open(linkWa(p.whatsapp, await mensajeWa(p)), '_blank') }

  const Fila = ({ p }: { p: Pend }) => (
    <Card className="!p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold">{p.nombre} <span className="font-mono text-sm text-bosque/70">{p.codigo}</span></p>
          <p className="text-sm">{p.tipo === 'entrada' ? '🎟️' : '🎁'} {p.detalle ?? p.tipo} · <strong>{pesos(p.total)}</strong> · {p.metodo_pago}</p>
          <p className="text-xs text-bosque/70">{fechaHora(p.created_at)}{p.vence_at ? ` · vence ${fechaHora(p.vence_at)}` : ''} · {p.whatsapp}{p.instagram ? <> · <a className="underline" href={`https://instagram.com/${p.instagram}`} target="_blank" rel="noreferrer">@{p.instagram}</a></> : null}</p>
        </div>
        <EstadoPedido estado={p.estado} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {p.comprobante_path && <Button variante="suave" onClick={() => verComprobante(p.comprobante_path!)}>Ver comprobante</Button>}
        {p.estado !== 'pagado' && p.estado !== 'cancelado' && <Button variante="exito" disabled={ocupado === p.id} onClick={() => validar(p)}>Validar pago</Button>}
        {['pendiente', 'comprobante_enviado'].includes(p.estado) && <Button variante="borde" disabled={ocupado === p.id} onClick={() => rechazar(p)}>Rechazar</Button>}
        {p.estado === 'pagado' && <Button variante="suave" onClick={() => reenviar(p)}>Reenviar por WhatsApp</Button>}
        <a className="self-center text-sm font-bold underline" href={`/p/${p.token}`} target="_blank" rel="noreferrer">Ver pedido</a>
      </div>
    </Card>
  )

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Pagos</h1>
      {msg && (
        <div className="space-y-2">
          <Alerta tipo={msg.tipo}>{msg.t}</Alerta>
          {msg.wa && <a href={msg.wa} target="_blank" rel="noreferrer" className="inline-block rounded-2xl bg-exito px-5 py-3 font-bold text-white">📲 Enviar por WhatsApp</a>}
        </div>
      )}
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); buscar() }}>
        <Input placeholder="Buscar por código, nombre o WhatsApp" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <Button>Buscar</Button>
      </form>
      {encontrados && (
        <section className="space-y-2">
          <h2 className="text-xl font-bold">Resultados ({encontrados.length})</h2>
          {encontrados.map((p) => <Fila key={p.id} p={p} />)}
        </section>
      )}
      <section className="space-y-2">
        <h2 className="text-xl font-bold">Por revisar</h2>
        {!lista ? <Spinner /> : (() => {
          const manuales = lista.filter((p) => p.metodo_pago !== 'mercadopago')
          const mp = lista.length - manuales.length
          return <>
            {manuales.length === 0 ? <p>No hay pagos pendientes 🎉</p> : manuales.map((p) => <Fila key={p.id} p={p} />)}
            {mp > 0 && <p className="text-sm text-bosque/70">Además hay {mp} pedido(s) de Mercado Pago sin terminar de pagar: se activan solos si pagan, o vencen a las 2 hs.</p>}
          </>
        })()}
      </section>
    </div>
  )
}
