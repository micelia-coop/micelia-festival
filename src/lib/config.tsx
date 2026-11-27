import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'
import type { Config } from './types'

const DEFAULT: Config = {
  festival: { nombre: 'Festival de Solsticio', fecha: '2026-12-19' },
  pago: {}, ventas: {}, desafio: {}, faq: [], bolsa: {}, canje: {},
  // Si todavía no existe la fila 'sitio' en la base, la web arranca en modo "Próximamente".
  sitio: {
    teaser: true, mostrar_entradas: false, mostrar_bolsa: false, mostrar_marcas: false,
    mostrar_postulacion: false, mostrar_info: false, mostrar_recorrido: false, mostrar_propuesta: true,
    teaser_kicker: 'Micelia Cooperativa presenta', teaser_titulo: 'Próximamente',
    teaser_bajada: 'Un día para celebrar en comunidad', teaser_fecha_label: 'Guardá esta fecha',
    teaser_fecha: '19 de diciembre', cuenta_hasta: '2026-12-19T13:00',
  },
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
      for (const row of data) c[row.clave] = row.clave === 'sitio' ? { ...DEFAULT.sitio, ...row.valor } : row.valor
      setConfig(c as Config)
    }
    setCargando(false)
  }

  useEffect(() => { recargar() }, [])

  return <ConfigCtx.Provider value={{ config, cargando, recargar }}>{children}</ConfigCtx.Provider>
}

export const useConfig = () => useContext(ConfigCtx)
