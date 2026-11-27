import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useConfig } from '../lib/config'
import { supabaseConfigurado } from '../lib/supabase'
import type { Sitio } from '../lib/types'
import { BotonRed, IconoInstagram, IconoTelegram, urlInstagram } from './Iconos'

const NAV: { to: string; label: string; flag?: keyof Sitio }[] = [
  { to: '/desafio', label: 'Desafío 21 días' },
  { to: '/entradas', label: 'Entradas', flag: 'mostrar_entradas' },
  { to: '/bolsa-ritual', label: 'Bolsa Ritual', flag: 'mostrar_bolsa' },
  { to: '/marcas', label: 'Guía de regalos', flag: 'mostrar_marcas' },
  { to: '/suma-tu-marca', label: 'Sumá tu marca', flag: 'mostrar_postulacion' },
  { to: '/info', label: 'Info y FAQ', flag: 'mostrar_info' },
]

export default function Layout() {
  const { config } = useConfig()
  const [abierto, setAbierto] = useState(false)
  const nav = NAV.filter((n) => !n.flag || config.sitio[n.flag])
  useEffect(() => {
    document.title = config.sitio.teaser ? `${config.festival.organiza ?? 'Micelia Cooperativa'} · Próximamente` : `${config.festival.nombre} · Micelia`
  }, [config.sitio.teaser, config.festival.nombre, config.festival.organiza])
  return (
    <div className="flex min-h-dvh flex-col">
      {!supabaseConfigurado && (
        <div className="bg-alerta px-4 py-2 text-center text-sm font-bold text-bosque">
          Falta configurar Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
        </div>
      )}
      <header className="sticky top-0 z-30 bg-bosque text-crema shadow">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-display text-xl font-bold leading-tight" onClick={() => setAbierto(false)}>
            {config.sitio.teaser ? (config.festival.organiza ?? 'Micelia Cooperativa') : config.festival.nombre}
            {!config.sitio.teaser && <span className="block text-xs font-sans font-semibold tracking-wide text-tierra">MICELIA COOPERATIVA</span>}
          </Link>
          <button className="rounded-xl px-3 py-2 font-bold ring-1 ring-tierra/60 md:hidden" aria-expanded={abierto}
            aria-controls="menu" onClick={() => setAbierto(!abierto)}>
            {abierto ? 'Cerrar' : 'Menú'}
          </button>
          <nav className="hidden gap-1 md:flex" aria-label="Principal">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) =>
                `rounded-xl px-3 py-2 text-sm font-bold ${isActive ? 'bg-crema text-bosque' : 'hover:bg-white/10'}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
        {abierto && (
          <nav id="menu" className="border-t border-white/10 px-4 pb-4 md:hidden" aria-label="Principal">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} onClick={() => setAbierto(false)}
                className={({ isActive }) => `block rounded-xl px-3 py-3 text-lg font-bold ${isActive ? 'bg-crema text-bosque' : ''}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="bg-bosque px-4 py-8 text-sm text-crema/90">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p><strong>{config.festival.organiza ?? 'Micelia Cooperativa'}</strong>{!config.sitio.teaser && ' · Festival cero papel 🌱'}</p>
          <div className="flex flex-wrap items-center gap-4">
            {urlInstagram(config.festival.instagram_url) && <BotonRed claro href={urlInstagram(config.festival.instagram_url)!} etiqueta="Instagram de Micelia"><IconoInstagram /></BotonRed>}
            <BotonRed claro href={config.festival.telegram_url || 'https://t.me/miceliacomunidad'} etiqueta="Comunidad de Micelia en Telegram"><IconoTelegram /></BotonRed>
            {config.sitio.mostrar_info && <Link className="underline" to="/info">Info y FAQ</Link>}
            <Link className="underline opacity-70" to="/panel">Guardianas</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
