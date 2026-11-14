import type { PedidoEstado } from '../lib/types'

export const ESTADO_TXT: Record<PedidoEstado, { t: string; c: string }> = {
  pendiente: { t: 'Pendiente de pago', c: 'var(--color-alerta)' },
  comprobante_enviado: { t: 'Comprobante en revisión', c: 'var(--color-lavanda)' },
  pagado: { t: 'Pagado ✓', c: 'var(--color-exito)' },
  rechazado: { t: 'Pago rechazado', c: 'var(--color-error)' },
  vencido: { t: 'Reserva vencida', c: 'var(--color-error)' },
  cancelado: { t: 'Anulado', c: 'var(--color-error)' },
}

export default function EstadoPedido({ estado }: { estado: PedidoEstado }) {
  const e = ESTADO_TXT[estado]
  return <span className="inline-block rounded-full px-3 py-1 text-sm font-bold text-white" style={{ background: e.c }}>{e.t}</span>
}
