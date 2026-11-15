import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'

export type Rol = 'admin' | 'alianzas' | 'desafio' | 'puerta' | 'tregua'
export type Perfil = { user_id: string; nombre: string; email: string | null; roles: Rol[] }

type Ctx = { session: Session | null; perfil: Perfil | null; cargando: boolean; error: string; puede: (r: Rol) => boolean; salir: () => Promise<void>; recargar: () => void }
const AuthCtx = createContext<Ctx>({ session: null, perfil: null, cargando: true, error: '', puede: () => false, salir: async () => {}, recargar: () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (!data.session) setCargando(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); if (!s) { setPerfil(null); setCargando(false) } })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    setCargando(true); setError('')
    supabase.from('perfiles').select('user_id,nombre,email,roles').eq('user_id', session.user.id).maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        setPerfil((data as Perfil) ?? null); setCargando(false)
      })
  }, [session?.user.id, intento])

  const puede = (r: Rol) => !!perfil && (perfil.roles.includes('admin') || perfil.roles.includes(r))
  const salir = async () => { await supabase.auth.signOut() }

  return <AuthCtx.Provider value={{ session, perfil, cargando, error, puede, salir, recargar: () => setIntento((n) => n + 1) }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
