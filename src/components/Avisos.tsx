import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Aviso = { id: string; texto: string; destacado: boolean }

export default function Avisos() {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  useEffect(() => {
    supabase.from('avisos').select('id,texto,destacado').eq('activo', true)
      .order('destacado', { ascending: false }).order('created_at', { ascending: false })
      .then(({ data }) => setAvisos(data ?? []))
  }, [])
  if (!avisos.length) return null
  return (
    <div className="space-y-2" aria-live="polite">
      {avisos.map((a) => (
        <div key={a.id} className={`rounded-2xl px-4 py-3 font-semibold ${a.destacado ? 'bg-acento text-bosque' : 'bg-secundario/50'}`}>
          📣 {a.texto}
        </div>
      ))}
    </div>
  )
}
