import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'
import type { Config } from './types'

const DEFAULT: Config = {
  festival: { nombre: 'Festival de Solsticio', fecha: '2026-12-19' },
  pago: {}, ventas: {}, desafio: {}, faq: [], bolsa: {}, canje: {},
}

type Ctx = { config: Config; cargando: boolean; recargar: () => Promise<void> }
const ConfigCtx = createContext<Ctx>({ config: DEFAULT, cargando: true, recargar: async () => {} })

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config>(DEFAULT)
  const [cargando, setCargando] = useState(true)

  const recargar = async () => {
    const { data } = await supabase.from('config').select('clave, valor')
    if (data) {
      const c = { ...DEFAULT } as Record<string, unknown>
      for (const row of data) c[row.clave] = row.valor
      setConfig(c as Config)
    }
    setCargando(false)
  }

  useEffect(() => { recargar() }, [])

  return <ConfigCtx.Provider value={{ config, cargando, recargar }}>{children}</ConfigCtx.Provider>
}

export const useConfig = () => useContext(ConfigCtx)
