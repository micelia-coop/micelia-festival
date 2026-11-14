import { useEffect, useState, type FormEvent } from 'react'
import { Alerta, Button, Card, Field, Input } from '../../components/ui'
import type { Perfil, Rol } from '../../lib/auth'
import { rpc, supabase } from '../../lib/supabase'

const ROLES: { r: Rol; t: string }[] = [
  { r: 'admin', t: 'Admin general (todo)' }, { r: 'alianzas', t: 'Alianzas (marcas y puestos)' },
  { r: 'desafio', t: 'Desafío (21 días e inscriptas)' }, { r: 'puerta', t: 'Puerta (ingresos y venta)' }, { r: 'tregua', t: 'La Tregua (almuerzos)' },
]

export default function Equipo() {
  const [lista, setLista] = useState<Perfil[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [msg, setMsg] = useState<{ tipo: 'exito' | 'error'; t: string } | null>(null)
  const cargar = () => supabase.from('perfiles').select('user_id,nombre,email,roles').order('nombre').then(({ data }) => setLista((data as Perfil[]) ?? []))
  useEffect(() => { cargar() }, [])

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    try {
      await rpc('asignar_roles', { p_email: f.get('email'), p_nombre: f.get('nombre'), p_roles: roles })
      setMsg({ tipo: 'exito', t: 'Roles guardados ✓' }); cargar()
    } catch (err) { setMsg({ tipo: 'error', t: (err as Error).message }) }
  }

  const editar = (p: Perfil) => {
    const form = document.getElementById('form-equipo') as HTMLFormElement
    ;(form.elements.namedItem('email') as HTMLInputElement).value = p.email ?? ''
    ;(form.elements.namedItem('nombre') as HTMLInputElement).value = p.nombre
    setRoles(p.roles); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Equipo</h1>
      <Alerta>Para sumar a alguien: 1) creá su cuenta en Supabase → Authentication → Users → <strong>Add user</strong> (email + contraseña, con “Auto confirm”). 2) Asignale sus roles acá.</Alerta>
      <Card>
        <form id="form-equipo" onSubmit={guardar} className="space-y-3">
          <Field label="Email"><Input name="email" type="email" required /></Field>
          <Field label="Nombre"><Input name="nombre" required /></Field>
          <fieldset className="space-y-1"><legend className="text-sm font-bold">Roles</legend>
            {ROLES.map(({ r, t }) => (
              <label key={r} className="flex items-center gap-2">
                <input type="checkbox" className="size-5 accent-bosque" checked={roles.includes(r)}
                  onChange={(e) => setRoles(e.target.checked ? [...roles, r] : roles.filter((x) => x !== r))} /> {t}
              </label>
            ))}
          </fieldset>
          {msg && <Alerta tipo={msg.tipo}>{msg.t}</Alerta>}
          <Button>Guardar</Button>
        </form>
      </Card>
      <ul className="space-y-2">
        {lista.map((p) => (
          <li key={p.user_id}><Card className="!p-4 flex items-center justify-between gap-2">
            <div><p className="font-bold">{p.nombre}</p><p className="text-sm">{p.email} · {p.roles.join(', ') || 'sin roles'}</p></div>
            <Button variante="suave" onClick={() => editar(p)}>Editar</Button>
          </Card></li>
        ))}
      </ul>
    </div>
  )
}
