import { lazy, Suspense, useState, type FormEvent } from 'react'
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { Alerta, Button, Card, Field, Input, Spinner } from '../../components/ui'
import { AuthProvider, useAuth, type Rol } from '../../lib/auth'
import { supabase } from '../../lib/supabase'

const Inicio = lazy(() => import('./PanelInicio'))
const Pagos = lazy(() => import('./Pagos'))
const Desafio = lazy(() => import('./PanelDesafio'))
const Marcas = lazy(() => import('./PanelMarcas'))
const Avisos = lazy(() => import('./PanelAvisos'))
const Config = lazy(() => import('./PanelConfig'))
const Equipo = lazy(() => import('./Equipo'))
const MiCuenta = lazy(() => import('./MiCuenta'))

const SECCIONES: { to: string; label: string; rol: Rol | null }[] = [
  { to: '', label: 'Inicio', rol: null },
  { to: 'pagos', label: 'Pagos', rol: 'admin' },
  { to: 'marcas', label: 'Marcas', rol: 'alianzas' },
  { to: 'desafio', label: 'Desafío', rol: 'desafio' },
  { to: 'avisos', label: 'Avisos', rol: 'admin' },
  { to: 'config', label: 'Configuración', rol: 'admin' },
  { to: 'equipo', label: 'Equipo', rol: 'admin' },
  { to: 'cuenta', label: 'Mi cuenta', rol: null },
]

export default function Panel() {
  return <AuthProvider><PanelInterno /></AuthProvider>
}

function PanelInterno() {
  const { session, perfil, cargando, error, puede, salir, recargar } = useAuth()
  if (cargando) return <Spinner />
  if (!session) return <Login />
  if (!perfil || !perfil.roles.length) return (
    <div className="mx-auto max-w-md p-6">
      <Alerta tipo="alerta">Tu cuenta ({session.user.email}) todavía no tiene un rol asignado. Pedile a una admin que te lo asigne.</Alerta>
      {error && <p className="mt-3 rounded-xl bg-white p-3 font-mono text-xs">Detalle técnico: {error}</p>}
      <div className="mt-4 flex gap-2">
        <Button onClick={recargar}>Volver a revisar</Button>
        <Button variante="borde" onClick={salir}>Salir</Button>
      </div>
    </div>
  )
  const visibles = SECCIONES.filter((s) => !s.rol || puede(s.rol))
  const ruta = (rol: Rol, el: React.ReactNode) => (puede(rol) ? el : <Navigate to="/panel" replace />)

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 bg-bosque text-crema">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/panel" className="font-display text-lg font-bold">Panel · Micelia</Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline">{perfil.nombre}</span>
            <button onClick={salir} className="rounded-lg px-2 py-1 font-bold ring-1 ring-tierra/60">Salir</button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2" aria-label="Panel">
          {visibles.map((s) => (
            <NavLink key={s.to} to={s.to ? `/panel/${s.to}` : '/panel'} end
              className={({ isActive }) => `shrink-0 rounded-xl px-3 py-2 text-sm font-bold ${isActive ? 'bg-crema text-bosque' : 'hover:bg-white/10'}`}>
              {s.label}
            </NavLink>
          ))}
          <a href="/" className="shrink-0 rounded-xl px-3 py-2 text-sm font-bold opacity-70">Ver sitio ↗</a>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route index element={<Inicio />} />
            <Route path="pagos" element={ruta('admin', <Pagos />)} />
            <Route path="marcas" element={ruta('alianzas', <Marcas />)} />
            <Route path="desafio" element={ruta('desafio', <Desafio />)} />
            <Route path="avisos" element={ruta('admin', <Avisos />)} />
            <Route path="config" element={ruta('admin', <Config />)} />
            <Route path="equipo" element={ruta('admin', <Equipo />)} />
            <Route path="cuenta" element={<MiCuenta />} />
            <Route path="*" element={<Navigate to="/panel" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

function Login() {
  const [modo, setModo] = useState<'clave' | 'link'>('clave')
  const [estado, setEstado] = useState<'' | 'enviando' | 'enviado'>('')
  const [error, setError] = useState('')

  async function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const email = String(f.get('email')).trim()
    setEstado('enviando'); setError('')
    if (modo === 'clave') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: String(f.get('clave')) })
      if (error) { setError('Email o contraseña incorrectos.'); setEstado('') }
    } else {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/panel` } })
      if (error) { setError('No pudimos enviar el link. Probá con contraseña.'); setEstado('') } else setEstado('enviado')
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bosque p-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-2xl font-bold">Panel de guardianas</h1>
        <p className="mb-4 text-sm text-bosque/70">Festival de Solsticio · Micelia</p>
        {estado === 'enviado' ? <Alerta tipo="exito">Te mandamos un link a tu email. Abrilo desde este mismo celular.</Alerta> : (
          <form onSubmit={entrar} className="space-y-3">
            <Field label="Email"><Input name="email" type="email" required autoComplete="email" /></Field>
            {modo === 'clave' && <Field label="Contraseña"><Input name="clave" type="password" required autoComplete="current-password" /></Field>}
            {error && <Alerta tipo="error">{error}</Alerta>}
            <Button grande disabled={estado === 'enviando'}>{estado === 'enviando' ? 'Entrando…' : modo === 'clave' ? 'Entrar' : 'Enviarme el link'}</Button>
            <button type="button" className="w-full text-sm font-bold underline" onClick={() => setModo(modo === 'clave' ? 'link' : 'clave')}>
              {modo === 'clave' ? 'Prefiero recibir un link por email' : 'Entrar con contraseña'}
            </button>
          </form>
        )}
        <Link to="/" className="mt-4 block text-center text-sm underline">← Volver al sitio</Link>
      </Card>
    </div>
  )
}
