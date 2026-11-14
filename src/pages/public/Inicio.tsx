import { Link } from 'react-router-dom'
import Avisos from '../../components/Avisos'
import CuentaRegresiva from '../../components/CuentaRegresiva'
import { useConfig } from '../../lib/config'
import { diaLocal, fechaLarga } from '../../lib/format'

const RECORRIDO = [
  { to: '/desafio', color: 'var(--color-lavanda)', etiqueta: 'Desde el 28/11 · online y gratis', titulo: 'Desafío de Gratitud', texto: '21 días, un video por día. Sumate y empezá a preparar el ritual.' },
  { to: '/entradas', color: 'var(--color-tierra)', etiqueta: '19/12 · 8 a 12 hs · cupo 20', titulo: 'Mañana de yoga + almuerzo', texto: 'Práctica con Respira y Transfórmate y almuerzo de La Tregua. Incluye la tarde.' },
  { to: '/entradas', color: 'var(--color-arcilla)', etiqueta: '19/12 · desde las 13 hs', titulo: 'Festival de la tarde', texto: 'Marcas emprendedoras, actividades y comida. Tu entrada es 100% canjeable.' },
  { to: '/bolsa-ritual', color: 'var(--color-amor)', etiqueta: 'Antes, durante y después', titulo: 'Bolsa Ritual + Guía de regalos', texto: 'Regalos conscientes de marcas emprendedoras para estas fiestas.' },
]

export default function Inicio() {
  const { config } = useConfig()
  const f = config.festival
  return (
    <div className="space-y-8">
      <section className="-mx-4 -mt-6 bg-bosque px-4 pb-10 pt-8 text-crema sm:rounded-b-[2.5rem]">
        <div className="mx-auto max-w-5xl space-y-5">
          <p className="font-bold uppercase tracking-widest text-tierra">{f.organiza ?? 'Micelia Cooperativa'} presenta</p>
          <h1 className="text-5xl font-bold leading-none sm:text-6xl">{f.nombre}</h1>
          <p className="max-w-xl text-lg text-crema/90">{f.bajada}</p>
          <div className="space-y-1 text-lg">
            <p>📅 <strong className="capitalize">{fechaLarga(diaLocal(f.fecha))}</strong></p>
            <p>📍 {f.lugar ? <strong>{f.lugar}</strong> : <span>Lugar a confirmar</span>}</p>
          </div>
          <CuentaRegresiva hasta={f.inicio_manana ?? `${f.fecha}T08:00:00-03:00`} />
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/entradas" className="rounded-2xl bg-acento px-6 py-4 text-lg font-bold text-bosque">Quiero mi entrada</Link>
            <Link to="/desafio" className="rounded-2xl bg-lavanda px-6 py-4 text-lg font-bold text-bosque">Sumarme al desafío</Link>
          </div>
        </div>
      </section>

      <Avisos />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">El recorrido</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {RECORRIDO.map((r) => (
            <Link key={r.titulo} to={r.to} className="group rounded-3xl bg-superficie p-5 shadow-sm ring-1 ring-secundario/60 transition hover:-translate-y-0.5"
              style={{ borderLeft: `8px solid ${r.color}` }}>
              <p className="text-sm font-bold text-bosque/70">{r.etiqueta}</p>
              <h3 className="mt-1 text-xl font-bold">{r.titulo}</h3>
              <p className="mt-1 text-bosque/80">{r.texto}</p>
              <p className="mt-3 font-bold underline decoration-2 underline-offset-4">Ver más →</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link to="/marcas" className="rounded-3xl bg-amor p-6 text-white">
          <h2 className="text-2xl font-bold">Guía de regalos conscientes</h2>
          <p className="mt-1 text-white/90">Conocé las marcas del festival y pediles directo por WhatsApp.</p>
        </Link>
        {f.telegram_url ? (
          <a href={f.telegram_url} target="_blank" rel="noreferrer" className="rounded-3xl bg-secundario p-6">
            <h2 className="text-2xl font-bold">Comunidad en Telegram</h2>
            <p className="mt-1 text-bosque/80">Novedades, recordatorios y el día a día del festival.</p>
          </a>
        ) : (
          <Link to="/suma-tu-marca" className="rounded-3xl bg-secundario p-6">
            <h2 className="text-2xl font-bold">¿Tenés una marca?</h2>
            <p className="mt-1 text-bosque/80">Postulate para estar en el festival y en la guía de regalos.</p>
          </Link>
        )}
      </section>
    </div>
  )
}
