// Crea la preferencia de Checkout Pro para un pedido y devuelve el link de pago.
// Llamada desde la web con { token } del pedido. Requiere el secreto MP_ACCESS_TOKEN.
// Configuración: "Verify JWT" desactivado (la web la llama con la clave pública).
import { createClient } from 'npm:@supabase/supabase-js@2'

const SITIO = Deno.env.get('SITIO_URL') ?? 'https://festival-micelia.pages.dev'
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { token } = await req.json().catch(() => ({}))
    if (!token || typeof token !== 'string') return json({ error: 'Falta el pedido.' }, 400)

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpToken) return json({ error: 'Mercado Pago no está configurado.' }, 500)

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: p } = await db.from('pedidos')
      .select('id, codigo, token, nombre, email, total, descuento, estado, metodo_pago, vence_at, pedido_items(nombre, cantidad, precio_unit)')
      .eq('token', token).maybeSingle()
    if (!p) return json({ error: 'No encontramos el pedido.' }, 404)
    if (p.metodo_pago !== 'mercadopago') return json({ error: 'Este pedido no es de Mercado Pago.' }, 400)
    if (p.estado === 'pagado') return json({ pagado: true })
    if (p.estado !== 'pendiente' || (p.vence_at && new Date(p.vence_at) <= new Date())) {
      return json({ error: 'La reserva venció. Hacé un pedido nuevo.' }, 409)
    }

    const pref = {
      // Con descuento, un solo ítem por el total (Mercado Pago no acepta ítems negativos).
      items: (p.descuento ?? 0) > 0
        ? [{ title: `Pedido ${p.codigo} · Festival de Solsticio`, quantity: 1, unit_price: Number(p.total), currency_id: 'ARS' }]
        : (p.pedido_items ?? []).map((i: { nombre: string; cantidad: number; precio_unit: number }) => ({
            title: i.nombre, quantity: i.cantidad, unit_price: Number(i.precio_unit), currency_id: 'ARS',
          })),
      payer: { name: p.nombre, email: p.email ?? undefined },
      external_reference: p.id,
      metadata: { pedido_token: p.token, codigo: p.codigo },
      back_urls: {
        success: `${SITIO}/p/${p.token}?mp=ok`,
        pending: `${SITIO}/p/${p.token}?mp=pendiente`,
        failure: `${SITIO}/p/${p.token}?mp=error`,
      },
      auto_return: 'approved',
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`,
      statement_descriptor: 'MICELIA',
    }

    const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { Authorization: `Bearer ${mpToken}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': `${p.id}-${Date.now()}` },
      body: JSON.stringify(pref),
    })
    const d = await r.json()
    if (!r.ok) { console.error('MP preferencia', r.status, d); return json({ error: 'Mercado Pago no respondió. Probá de nuevo en un momento.' }, 502) }

    await db.from('pedidos').update({ mp_preference_id: d.id }).eq('id', p.id)
    const sandbox = Deno.env.get('MP_SANDBOX') === '1' || mpToken.startsWith('TEST-')
    return json({ url: sandbox ? (d.sandbox_init_point ?? d.init_point) : d.init_point })
  } catch (e) {
    console.error(e)
    return json({ error: 'Error inesperado.' }, 500)
  }
})
