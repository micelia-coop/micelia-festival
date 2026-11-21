import { useState, type FormEvent } from 'react'
import { Alerta, Button, Card, Field, Input } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'

export default function MiCuenta() {
  const { perfil, session } = useAuth()
  const [msg, setMsg] = useState<{ tipo: 'exito' | 'error'; t: string } | null>(null)
  const [guardando, setGuardando] = useState(false)

  async function cambiar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    const a = String(f.get('clave')), b = String(f.get('repetir'))
    if (a.length < 8) { setMsg({ tipo: 'error', t: 'La contraseña tiene que tener al menos 8 caracteres.' }); return }
    if (a !== b) { setMsg({ tipo: 'error', t: 'Las dos contraseñas no coinciden.' }); return }
    setGuardando(true); setMsg(null)
    const { error } = await supabase.auth.updateUser({ password: a })
    setGuardando(false)
    if (error) setMsg({ tipo: 'error', t: /same|different/i.test(error.message) ? 'Elegí una contraseña distinta a la actual.' : 'No se pudo cambiar: ' + error.message })
    else { setMsg({ tipo: 'exito', t: 'Contraseña cambiada ✓ Guardala en un lugar seguro.' }); form.reset() }
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <h1 className="text-3xl font-bold">Mi cuenta</h1>
      <Card>
        <p><strong>{perfil?.nombre}</strong></p>
        <p className="text-sm">{session?.user.email}</p>
        <p className="mt-1 text-sm text-bosque/70">Roles: {perfil?.roles.join(', ')}</p>
      </Card>
      <Card>
        <h2 className="mb-3 text-xl font-bold">Cambiar contraseña</h2>
        <form onSubmit={cambiar} className="space-y-3">
          <Field label="Nueva contraseña" hint="Mínimo 8 caracteres"><Input name="clave" type="password" required autoComplete="new-password" /></Field>
          <Field label="Repetila"><Input name="repetir" type="password" required autoComplete="new-password" /></Field>
          {msg && <Alerta tipo={msg.tipo}>{msg.t}</Alerta>}
          <Button disabled={guardando}>{guardando ? 'Guardando…' : 'Cambiar contraseña'}</Button>
        </form>
      </Card>
    </div>
  )
}
