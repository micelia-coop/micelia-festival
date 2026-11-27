// Recibe los avisos de Mercado Pago. Por seguridad NO confía en lo que llega:
// consulta el pago directamente a la API de Mercado Pago con nuestro token
// y recién ahí marca el pedido como pagado.
// Configuración: "Verify JWT" desactivado (Mercado Pago no manda JWT).
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url)
    const body = await req.json().catch(() => ({} as Record<string, unknown>))
    const tipo = (body.type ?? body.topic ?? url.searchParams.get('type') ?? url.searchParams.get('topic')) as string | null
    const id = ((body.data as { id?: string } | undefined)?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id')) as string | null
    if (tipo !== 'payment' || !id) return new Response('ignorado', { status: 200 })

    const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(String(id))}`, {
      headers: { Authorization: `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}` },
    })
    if (!r.ok) { console.error('MP pago', id, r.status); return new Response('error', { status: 500 }) }
    const pago = await r.json()
    if (!pago.external_reference) return new Response('sin referencia', { status: 200 })

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data, error } = await db.rpc('mp_registrar_pago', {
      p_pedido_id: pago.external_reference, p_payment_id: String(pago.id), p_status: pago.status,
      p_monto: pago.transaction_amount,
    })
    if (error) { console.error(error); return new Response('error', { status: 500 }) }
    console.log('pago', pago.id, pago.status, data)
    return new Response('ok', { status: 200 })
  } catch (e) {
    console.error(e)
    return new Response('error', { status: 500 })
  }
})
