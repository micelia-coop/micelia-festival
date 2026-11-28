import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { DatosComprador, irAMercadoPago, MetodoPago, type Metodo } from '../../components/Checkout'
import { Alerta, Button, Card, Input, Spinner, Titulo } from '../../components/ui'
import { pctDescuentoBolsa, useConfig } from '../../lib/config'
import { pesos } from '../../lib/format'
import { rpc } from '../../lib/supabase'
import type { TipoEntrada } from '../../lib/types'

const ACENTO: Record<number, string> = { 1: 'var(--color-tierra)', 2: 'var(--color-arcilla)' }

export default function Entradas() {
  const { config } = useConfig()
  const nav = useNavigate()
  const [tipos, setTipos] = useState<TipoEntrada[] | null>(null)
  const [cant, setCant] = useState<Record<string, number>>({})
  const [mats, setMats] = useState<Record<string, (boolean | null)[]>>({})
  const [metodo, setMetodo] = useState<Metodo>('transferencia')
  const conMP = config.ventas.mercadopago === true
  useEffect(() => { if (conMP) setMetodo('mercadopago') }, [conMP])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [codigo, setCodigo] = useState('')
  const [cod, setCod] = useState<{ ok: boolean; pct?: number; mensaje: string } | null>(null)
  async function aplicarCodigo() {
    if (!codigo.trim()) return
    try { setCod(await rpc<{ ok: boolean; pct?: number; mensaje: string }>('verificar_codigo_marca', { p_codigo: codigo.trim() })) }
    catch (e) { setCod({ ok: false, mensaje: (e as Error).message }) }
  }
  const abiertas = config.ventas.entradas_abiertas === true

  useEffect(() => { rpc<TipoEntrada[]>('tipos_entrada_disponibles').then(setTipos).catch((e) => setError(e.message)) }, [])

  const subtotal = (tipos ?? []).reduce((s, t) => s + (cant[t.id] ?? 0) * t.precio, 0)
  const descuento = cod?.ok && cod.pct ? Math.min(Math.round(subtotal * Number(cod.pct) / 100), subtotal) : 0
  const total = subtotal - descuento
  const nTotal = Object.values(cant).reduce((a, b) => a + b, 0)

  const cambiar = (t: TipoEntrada, d: number) => setCant((c) => {
    const max = Math.min(10, t.restantes ?? 10)
    return { ...c, [t.id]: Math.max(0, Math.min(max, (c[t.id] ?? 0) + d)) }
  })

  async function comprar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!nTotal) { setError('Elegí al menos una entrada.'); return }
    const faltaMat = (tipos ?? []).some((t) => t.pregunta_mat && (cant[t.id] ?? 0) > 0 &&
      Array.from({ length: cant[t.id] }, (_, i) => mats[t.id]?.[i] ?? null).some((m) => m === null))
    if (faltaMat) { setError('Contanos si cada persona trae su mat o necesita que se lo prestemos.'); return }
    const f = new FormData(e.currentTarget)
    setEnviando(true); setError('')
    try {
      const r = await rpc<{ token: string }>('crear_pedido_entradas', {
        p_nombre: f.get('nombre'), p_email: f.get('email'), p_whatsapp: f.get('whatsapp'), p_metodo: metodo,
        p_instagram: f.get('instagram'),
        ...(cod?.ok ? { p_codigo_descuento: codigo.trim() } : {}),
        p_items: Object.entries(cant).filter(([, n]) => n > 0).map(([id, n]) => ({
          tipo_entrada_id: id, cantidad: n, mats: Array.from({ length: n }, (_, i) => mats[id]?.[i] ?? null),
        })),
      })
      if (metodo === 'mercadopago') {
        const err = await irAMercadoPago(r.token)
        if (err) nav(`/p/${r.token}`)
        return
      }
      nav(`/p/${r.token}`)
    } catch (err) { setError((err as Error).message); setEnviando(false) }
  }

  return (
    <div className="space-y-6">
      <Titulo bajada="Sábado 19 de diciembre. Entradas en tu celular: cero papel.">Entradas</Titulo>
      {!abiertas && <Alerta tipo="alerta">{config.ventas.mensaje_cerrado ?? 'La venta abre muy pronto.'}</Alerta>}
      {!tipos ? <Spinner /> : (
        <form onSubmit={comprar} className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            {tipos.map((t) => {
              const agotada = t.restantes === 0
              return (
                <Card key={t.id} acento={ACENTO[t.orden] ?? 'var(--color-acento)'}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-bold">{t.nombre}</h2>
                      <p className="font-display text-3xl font-bold">{pesos(t.precio)}</p>
                    </div>
                    {t.cupo != null && (
                      <span className={`rounded-full px-3 py-1 text-sm font-bold ${agotada ? 'bg-error text-white' : 'bg-secundario'}`}>
                        {agotada ? 'Agotada' : `Quedan ${t.restantes}`}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-bosque/80">{t.descripcion}</p>
                  <ul className="mt-2 space-y-1 text-sm font-semibold">
                    {t.incluye_almuerzo && <li>🥟 Incluye vale de almuerzo de La Tregua</li>}
                    {t.incluye_festival && <li>🌿 Incluye el festival de la tarde</li>}
                    {t.descuento_bolsa && pctDescuentoBolsa(config) && <li>🎁 {pctDescuentoBolsa(config)}% de descuento en la Bolsa Ritual (online o en el festival)</li>}
                  </ul>
                  {abiertas && !agotada && (
                    <div className="mt-4 flex items-center gap-3" role="group" aria-label={`Cantidad de ${t.nombre}`}>
                      <Button type="button" variante="borde" className="size-12 !p-0 text-2xl" onClick={() => cambiar(t, -1)} aria-label="Quitar una">−</Button>
                      <span className="w-8 text-center text-2xl font-bold" aria-live="polite">{cant[t.id] ?? 0}</span>
                      <Button type="button" variante="borde" className="size-12 !p-0 text-2xl" onClick={() => cambiar(t, 1)} aria-label="Agregar una">+</Button>
                    </div>
                  )}
                  {abiertas && t.pregunta_mat && (cant[t.id] ?? 0) > 0 && (
                    <fieldset className="mt-4 space-y-2 rounded-2xl bg-fondo p-3">
                      <legend className="px-1 text-sm font-bold">🧘 ¿Traen su mat de yoga?</legend>
                      {Array.from({ length: cant[t.id] }, (_, i) => {
                        const v = mats[t.id]?.[i] ?? null
                        const set = (val: boolean) => setMats((m) => { const arr = [...(m[t.id] ?? [])]; arr[i] = val; return { ...m, [t.id]: arr } })
                        const op = (val: boolean, txt: string) => (
                          <button type="button" onClick={() => set(val)} aria-pressed={v === val}
                            className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ring-2 ${v === val ? 'bg-bosque text-white ring-bosque' : 'bg-white ring-secundario'}`}>{txt}</button>
                        )
                        return (
                          <div key={i} className="space-y-1">
                            {cant[t.id] > 1 && <p className="text-xs font-bold text-bosque/70">Persona {i + 1}</p>}
                            <div className="flex gap-2">{op(true, 'Traigo mi mat')}{op(false, 'Necesito que me presten')}</div>
                          </div>
                        )
                      })}
                    </fieldset>
                  )}
                </Card>
              )
            })}
          </div>
          {abiertas && (
            <Card className="h-fit space-y-4 md:sticky md:top-24">
              <h2 className="text-xl font-bold">Tus datos</h2>
              <DatosComprador />
              <div className="space-y-2">
                <p className="text-sm font-bold">¿Tenés un código de una marca aliada?</p>
                <div className="flex gap-2">
                  <Input placeholder="CÓDIGO" value={codigo} autoCapitalize="characters" onChange={(e) => { setCodigo(e.target.value.toUpperCase()); setCod(null) }} aria-label="Código de descuento" />
                  <Button type="button" variante="suave" onClick={aplicarCodigo}>Aplicar</Button>
                </div>
                {cod && <p className={`text-sm font-bold ${cod.ok ? 'text-exito' : 'text-error'}`}>{cod.mensaje}</p>}
              </div>
              <MetodoPago valor={metodo} onChange={setMetodo} conMP={conMP} />
              {descuento > 0 && <p className="flex justify-between font-bold text-exito"><span>Descuento</span><span>− {pesos(descuento)}</span></p>}
              <div className="flex items-baseline justify-between border-t border-secundario pt-3">
                <span className="font-bold">Total</span>
                <span className="font-display text-3xl font-bold">{pesos(total)}</span>
              </div>
              {error && <Alerta tipo="error">{error}</Alerta>}
              <Button grande disabled={enviando || !nTotal}>{enviando ? 'Reservando…' : metodo === 'mercadopago' ? 'Ir a pagar con Mercado Pago' : 'Continuar al pago'}</Button>
            </Card>
          )}
        </form>
      )}
    </div>
  )
}
