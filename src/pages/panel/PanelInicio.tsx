import { useEffect, useState } from 'react'
import { Alerta, Card, Spinner } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { pesos } from '../../lib/format'
import { rpc } from '../../lib/supabase'

type M = {
  inscriptas_desafio: number; pagos_por_revisar: number; pendientes: number; canjes: number; bolsas_pagadas: number; efectivo_puerta: number
  entradas: { tipo: string; cupo: number | null; pagadas: number; reservadas: number; ingresaron: number; almuerzos_retirados: number; incluye_almuerzo: boolean; pregunta_mat?: boolean; mats_a_prestar?: number; mats_propios?: number }[]
  capacidad_canje: { sin_tope: boolean; cupos: number; entradas_canjeables: number }
}

export default function PanelInicio() {
  const { perfil, puede } = useAuth()
  const [m, setM] = useState<M | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        if (puede('admin')) await rpc('vencer_pedidos')
        setM(await rpc<M>('metricas_panel'))
      } catch (e) { setError((e as Error).message) }
    })()
  }, [])

  const Num = ({ n, l, c }: { n: number | string; l: string; c?: string }) => (
    <Card className="!p-4"><p className="font-display text-4xl font-bold" style={c ? { color: c } : undefined}>{n}</p><p className="text-sm font-bold text-bosque/70">{l}</p></Card>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Hola, {perfil?.nombre.split(' ')[0]} 🌿</h1>
      {error && <Alerta tipo="error">{error}</Alerta>}
      {!m ? !error && <Spinner /> : (
        <>
          {m.pagos_por_revisar > 0 && puede('admin') && <Alerta tipo="alerta">Hay {m.pagos_por_revisar} comprobante(s) esperando validación → pestaña Pagos.</Alerta>}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Num n={m.inscriptas_desafio} l="Inscriptas al desafío" c="var(--color-lavanda)" />
            <Num n={m.pagos_por_revisar} l="Comprobantes por revisar" />
            <Num n={m.pendientes} l="Reservas pendientes" />
            <Num n={m.bolsas_pagadas} l="Bolsas pagadas" c="var(--color-amor)" />
          </div>
          <section className="grid gap-3 md:grid-cols-2">
            {m.entradas.map((t) => (
              <Card key={t.tipo}>
                <h2 className="text-xl font-bold">{t.tipo}</h2>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div><dt className="text-bosque/70">Pagadas</dt><dd className="text-2xl font-bold">{t.pagadas}</dd></div>
                  <div><dt className="text-bosque/70">Reservadas sin pagar</dt><dd className="text-2xl font-bold">{t.reservadas}</dd></div>
                  {t.cupo != null && <div><dt className="text-bosque/70">Lugares libres</dt><dd className="text-2xl font-bold">{Math.max(t.cupo - t.pagadas - t.reservadas, 0)} / {t.cupo}</dd></div>}
                  <div><dt className="text-bosque/70">Ingresaron</dt><dd className="text-2xl font-bold">{t.ingresaron}</dd></div>
                  {t.incluye_almuerzo && <div><dt className="text-bosque/70">Almuerzos a preparar</dt><dd className="text-2xl font-bold">{t.pagadas}</dd></div>}
                  {t.incluye_almuerzo && <div><dt className="text-bosque/70">Almuerzos retirados</dt><dd className="text-2xl font-bold">{t.almuerzos_retirados}</dd></div>}
                  {t.pregunta_mat && <div><dt className="text-bosque/70">🧘 Mats a prestar</dt><dd className="text-2xl font-bold">{t.mats_a_prestar ?? 0}</dd></div>}
                  {t.pregunta_mat && <div><dt className="text-bosque/70">Traen su mat</dt><dd className="text-2xl font-bold">{t.mats_propios ?? 0}</dd></div>}
                </dl>
              </Card>
            ))}
          </section>
          <Card>
            <h2 className="text-xl font-bold">Capacidad de canje</h2>
            <p className="mt-1">Entradas canjeables vendidas o reservadas: <strong>{m.capacidad_canje.entradas_canjeables}</strong> · Cupos en puestos: <strong>{m.capacidad_canje.sin_tope ? 'sin tope' : m.capacidad_canje.cupos}</strong> · Canjes hechos: <strong>{m.canjes}</strong></p>
            {!m.capacidad_canje.sin_tope && m.capacidad_canje.cupos < m.capacidad_canje.entradas_canjeables && (
              <div className="mt-2"><Alerta tipo="error">⚠️ Faltan {m.capacidad_canje.entradas_canjeables - m.capacidad_canje.cupos} lugares de canje. Sumá puestos o puestos sin tope.</Alerta></div>
            )}
          </Card>
          {m.efectivo_puerta > 0 && <Card><h2 className="font-bold">Efectivo cobrado en puerta</h2><p className="text-3xl font-bold">{pesos(m.efectivo_puerta)}</p></Card>}
        </>
      )}
    </div>
  )
}
