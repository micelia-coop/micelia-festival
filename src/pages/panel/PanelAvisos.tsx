import { useEffect, useState } from 'react'
import { Button, Card, Input } from '../../components/ui'
import { fechaHora } from '../../lib/format'
import { supabase } from '../../lib/supabase'

type Aviso = { id: string; texto: string; destacado: boolean; activo: boolean; created_at: string }

export default function PanelAvisos() {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [texto, setTexto] = useState('')
  const cargar = () => supabase.from('avisos').select('*').order('created_at', { ascending: false }).then(({ data }) => setAvisos((data as Aviso[]) ?? []))
  useEffect(() => { cargar() }, [])

  async function crear() {
    if (!texto.trim()) return
    await supabase.from('avisos').insert({ texto: texto.trim(), activo: true }); setTexto(''); cargar()
  }
  const set = async (id: string, c: Partial<Aviso>) => { await supabase.from('avisos').update(c).eq('id', id); cargar() }
  const borrar = async (id: string) => { if (confirm('¿Borrar este aviso?')) { await supabase.from('avisos').delete().eq('id', id); cargar() } }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Avisos</h1>
      <p>Se muestran en el Inicio del sitio. Los destacados van primero y en color.</p>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); crear() }}>
        <Input placeholder="Nuevo aviso (corto)" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={200} />
        <Button>Publicar</Button>
      </form>
      <div className="space-y-2">
        {avisos.map((a) => (
          <Card key={a.id} className={`!p-4 ${a.activo ? '' : 'opacity-60'}`}>
            <p className="font-semibold">{a.texto}</p>
            <p className="text-xs text-bosque/60">{fechaHora(a.created_at)}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button variante={a.activo ? 'suave' : 'exito'} onClick={() => set(a.id, { activo: !a.activo })}>{a.activo ? 'Ocultar' : 'Mostrar'}</Button>
              <Button variante="suave" onClick={() => set(a.id, { destacado: !a.destacado })}>{a.destacado ? 'Quitar destacado' : 'Destacar'}</Button>
              <Button variante="borde" onClick={() => borrar(a.id)}>Borrar</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
