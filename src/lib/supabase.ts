import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigurado = Boolean(url && key)

export const supabase = createClient(url ?? 'http://localhost:54321', key ?? 'sin-configurar', {
  auth: { persistSession: true, autoRefreshToken: true },
})

/** Llama a una función RPC y devuelve el dato o lanza un Error con mensaje legible. */
export async function rpc<T = unknown>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new Error(mensajeError(error.message))
  return data as T
}

export function mensajeError(msg: string): string {
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'Sin conexión. Revisá tu internet y probá de nuevo.'
  if (/permission denied|No tenés permiso/i.test(msg)) return 'No tenés permiso para hacer esto.'
  return msg
}

export function urlPublica(bucket: string, path?: string | null): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//.test(path)) return path
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}
