import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { irAMercadoPago } from '../../components/Checkout'
import EstadoPedido from '../../components/EstadoPedido'
import PagoTransferencia from '../../components/PagoTransferencia'
import { Alerta, Button, Card, LinkButton, Spinner } from '../../components/ui'
import { useConfig } from '../../lib/config'
import { fechaHora, pesos } from '../../lib/format'
import { rpc } from '../../lib/supabase'
import type { PedidoPublico } from '../../lib/types'
import { linkWa, origen } from '../../lib/whatsapp'

export default function MiPedido() {
  const { token = '' } = useParams()
  const { config } = useConfig()
  const [p, setP] = useState<PedidoPublico | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [params] = useSearchParams()
  const vuelveMP = params.get('mp')
  const [yendo, setYendo] = useState(false)
  const [errMP, setErrMP] = useState('')

  const cargar = useCallback(() => rpc<PedidoPublico | null>('ver_pedido', { p_token: token }).then(setP).catch((e) => setError(e.message)), [token])
  useEffect(() => { cargar() }, [cargar])

  // Al volver de Mercado Pago, el aviso del pago puede tardar unos segundos: reconsultamos.
  useEffect(() => {
    if (!vuelveMP || vuelveMP === 'error' || !p || p.estado === 'pagado' || p.metodo_pago !== 'mercadopago') return
    const t = setTimeout(() => { cargar() }, 3000)
    return () => clearTimeout(t)
  }, [vuelveMP, p, cargar])

  async function pagarMP() {
    setYendo(true); setErrMP('')
    const err = await irAMercadoPago(token)
    if (err) { setErrMP(err); setYendo(false) } else cargar()
  }

  if (error) return <Alerta tipo="error">{error}</Alerta>
  if (p === undefined) return <Spinner />
  if (p === null) return <Alerta tipo="error">No encontramos este pedido. Revisá el link.</Alerta>

  const urlPedido = `${origen()}/p/${p.token}`
  const contacto = config.festival.whatsapp_contacto

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <header className="space-y-2">
        <p className="font-bold text-bosque/70">Pedido {p.codigo}</p>
        <h1 className="text-3xl font-bold">¡Gracias, {p.nombre.split(' ')[0]}!</h1>
        <EstadoPedido estado={p.estado} />
      </header>

      <Alerta>📌 Guardá este link: acá vas a ver el estado de tu pedido{p.tipo === 'entrada' ? ' y tus entradas' : ''}.</Alerta>

      <Card>
        <ul className="divide-y divide-secundario/60">
          {p.items.map((i, k) => (
            <li key={k} className="flex justify-between gap-3 py-2">
              <span>{i.cantidad} × {i.nombre}</span><span className="font-bold">{pesos(i.cantidad * i.precio_unit)}</span>
            </li>
          ))}
        </ul>
        {(p.descuento ?? 0) > 0 && <p className="flex justify-between py-1 text-exito"><span>🎁 Descuento con entrada {p.descuento_entrada}</span><span className="font-bold">− {pesos(p.descuento!)}</span></p>}
        <p className="mt-2 flex justify-between border-t-2 border-bosque pt-2 text-lg font-bold"><span>Total</span><span>{pesos(p.total)}</span></p>
        {p.tipo === 'bolsa' && (
          <div className="mt-3 space-y-1 text-sm">
            <p>📦 Retiro: <strong>{p.entrega === 'retiro_petruca' ? (config.bolsa.direccion_petruca ?? 'Local de Petruca') : 'El día del festival'}</strong></p>
            {p.es_regalo && <p>🎁 Para regalar{p.regalo_para ? ` a ${p.regalo_para}` : ''}</p>}
            {p.entregado && <p className="font-bold text-exito">✓ Ya fue entregada</p>}
          </div>
        )}
      </Card>

      {p.estado !== 'pagado' && p.metodo_pago === 'transferencia' && ['pendiente', 'comprobante_enviado', 'rechazado'].includes(p.estado) && (
        <Card>
          {p.estado === 'rechazado' && <div className="mb-3"><Alerta tipo="error">No pudimos validar el pago. Revisá el comprobante o escribinos.</Alerta></div>}
          <PagoTransferencia token={p.token} codigo={p.codigo} total={p.total} pago={p.pago} yaSubido={p.tiene_comprobante} onSubido={cargar} />
        </Card>
      )}

      {p.estado === 'pendiente' && p.metodo_pago === 'efectivo' && (
        <Card>
          <h2 className="text-xl font-bold">Tu reserva está hecha</h2>
          <p className="mt-1">Pagá {pesos(p.total)} en efectivo a una guardiana{p.tipo === 'entrada' ? ' o en la puerta del festival' : ''}, mencionando el código <strong>{p.codigo}</strong>.</p>
          {p.vence_at && <p className="mt-2 text-sm font-bold text-error">La reserva vence el {fechaHora(p.vence_at)} si no se paga.</p>}
        </Card>
      )}

      {p.metodo_pago === 'mercadopago' && p.estado === 'pendiente' && (
        <Card className="space-y-3">
          {vuelveMP && vuelveMP !== 'error'
            ? <Alerta>⏳ Estamos confirmando tu pago con Mercado Pago. Esta página se actualiza sola en unos segundos.</Alerta>
            : <>
                {vuelveMP === 'error' && <Alerta tipo="error">El pago no se completó. Podés intentarlo de nuevo.</Alerta>}
                <h2 className="text-xl font-bold">Pagá con Mercado Pago</h2>
                <p>Tu reserva se mantiene unas horas. Completá el pago para activar {p.tipo === 'entrada' ? 'tus entradas' : 'tu pedido'}.</p>
                <Button grande disabled={yendo} onClick={pagarMP}>{yendo ? 'Abriendo Mercado Pago…' : `Pagar ${pesos(p.total)} con Mercado Pago`}</Button>
                {errMP && <Alerta tipo="error">{errMP}</Alerta>}
              </>}
        </Card>
      )}

      {p.estado === 'vencido' && (
        <Alerta tipo="error">La reserva venció y se liberó el lugar. Podés hacer un pedido nuevo o escribirnos.</Alerta>
      )}

      {p.tipo === 'entrada' && p.entradas.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold">Tus entradas</h2>
          <p className="mb-3 text-sm text-bosque/80">{p.estado === 'pagado' ? 'Ya están activas. Si compraste para otras personas, mandales su link.' : 'Se activan cuando validemos el pago.'}</p>
          <ul className="space-y-2">
            {p.entradas.map((e) => (
              <li key={e.token} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-fondo p-3">
                <div><p className="font-bold">{e.titular_nombre}</p><p className="text-sm">{e.tipo} · {e.codigo_corto}{e.trae_mat != null ? (e.trae_mat ? ' · trae mat' : ' · necesita mat') : ''}</p></div>
                <div className="flex gap-2">
                  <Link to={`/e/${e.token}`} className="rounded-xl bg-bosque px-3 py-2 text-sm font-bold text-white">Ver QR</Link>
                  <a href={linkWa(null, `Tu entrada para el ${config.festival.nombre}: ${origen()}/e/${e.token}`)} target="_blank" rel="noreferrer"
                    className="rounded-xl bg-secundario px-3 py-2 text-sm font-bold">Compartir</a>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <LinkButton variante="suave" to={linkWa(null, `Mi pedido del ${config.festival.nombre}: ${urlPedido}`)}>Guardar link en WhatsApp</LinkButton>
        {contacto && <LinkButton variante="borde" to={linkWa(contacto, `Hola! Tengo una consulta sobre mi pedido ${p.codigo}`)}>Consultar</LinkButton>}
      </div>
    </div>
  )
}
