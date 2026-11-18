import { useEffect, useState } from 'react'
import { Alerta, Button, Card, Input, Spinner, Textarea } from '../../components/ui'
import { descargarCsv } from '../../lib/csv'
import { fechaHora } from '../../lib/format'
import { supabase } from '../../lib/supabase'

type Dia = { dia: number; fecha: string; titulo: string | null; descripcion: string | null; youtube_url: string | null; publicado: boolean }
type Insc = { id: string; nombre: string; email: string; whatsapp: string | null; instagram: string | null; ciudad: string | null; como_se_entero: string | null; acepta_comunicaciones: boolean; created_at: string }

export default function PanelDesafio() {
  const [dias, setDias] = useState<Dia[] | null>(null)
  const [insc, setInsc] = useState<Insc[]>([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('desafio_dias').select('*').order('dia').then(({ data }) => setDias((data as Dia[]) ?? []))
    supabase.from('desafio_inscripciones').select('id,nombre,email,whatsapp,instagram,ciudad,como_se_entero,acepta_comunicaciones,created_at')
      .order('created_at', { ascending: false }).then(({ data }) => setInsc((data as Insc[]) ?? []))
  }, [])

  const cambiar = (dia: number, campo: keyof Dia, v: unknown) => setDias((ds) => ds!.map((d) => (d.dia === dia ? { ...d, [campo]: v } : d)))

  async function guardar(d: Dia) {
    const { error } = await supabase.from('desafio_dias').update({
      fecha: d.fecha, titulo: d.titulo, descripcion: d.descripcion, youtube_url: d.youtube_url?.trim() || null, publicado: d.publicado,
    }).eq('dia', d.dia)
    setMsg(error ? `Error: ${error.message}` : `Día ${d.dia} guardado ✓`)
    setTimeout(() => setMsg(''), 2500)
  }

  async function correrFechas() {
    const inicio = prompt('Fecha del día 1 (AAAA-MM-DD):', dias?.[0]?.fecha)
    if (!inicio || !/^\d{4}-\d{2}-\d{2}$/.test(inicio)) return
    const base = new Date(`${inicio}T12:00:00Z`)
    for (const d of dias!) {
      const f = new Date(base.getTime() + (d.dia - 1) * 86_400_000).toISOString().slice(0, 10)
      await supabase.from('desafio_dias').update({ fecha: f }).eq('dia', d.dia)
    }
    const { data } = await supabase.from('desafio_dias').select('*').order('dia'); setDias(data as Dia[])
    setMsg('Fechas actualizadas ✓')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Desafío de Gratitud</h1>
      <Alerta>Cada día se ve en el sitio cuando está <strong>publicado</strong> y llegó su <strong>fecha</strong>. Podés cargar y publicar todo por adelantado.</Alerta>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">Inscriptas: {insc.length}</h2>
          <Button variante="suave" disabled={!insc.length} onClick={() => descargarCsv('inscriptas-desafio.csv', insc.map(({ id: _id, ...r }) => r))}>Descargar CSV</Button>
        </div>
        <ul className="mt-3 max-h-72 divide-y divide-secundario/60 overflow-y-auto text-sm">
          {insc.map((i) => <li key={i.id} className="py-2"><strong>{i.nombre}</strong> · {i.email} · {i.whatsapp ?? '—'}{i.instagram ? ` · @${i.instagram}` : ''} <span className="text-bosque/60">· {fechaHora(i.created_at)}</span></li>)}
        </ul>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Los 21 días</h2>
        <Button variante="borde" onClick={correrFechas} disabled={!dias}>Cambiar fecha de inicio</Button>
      </div>
      {msg && <div className="sticky top-28 z-20"><Alerta tipo={msg.startsWith('Error') ? 'error' : 'exito'}>{msg}</Alerta></div>}
      {!dias ? <Spinner /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {dias.map((d) => (
            <Card key={d.dia} className="!p-4 space-y-2" acento={d.publicado ? 'var(--color-lavanda)' : undefined}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold">Día {d.dia}</h3>
                <Input type="date" value={d.fecha} onChange={(e) => cambiar(d.dia, 'fecha', e.target.value)} className="!w-auto !py-2" />
              </div>
              <Input placeholder="Título" value={d.titulo ?? ''} onChange={(e) => cambiar(d.dia, 'titulo', e.target.value)} />
              <Textarea placeholder="Descripción (opcional)" rows={2} value={d.descripcion ?? ''} onChange={(e) => cambiar(d.dia, 'descripcion', e.target.value)} />
              <Input placeholder="Link de YouTube" value={d.youtube_url ?? ''} onChange={(e) => cambiar(d.dia, 'youtube_url', e.target.value)} />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 font-bold">
                  <input type="checkbox" className="size-5 accent-bosque" checked={d.publicado} onChange={(e) => cambiar(d.dia, 'publicado', e.target.checked)} /> Publicado
                </label>
                <Button onClick={() => guardar(d)}>Guardar</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
