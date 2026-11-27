import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { BotonRed, IconoInstagram, IconoTelegram, urlInstagram } from '../../components/Iconos'
import { useConfig } from '../../lib/config'
import { lineas, propuestaCompleta } from '../../lib/propuesta'
import Marcas from './Marcas'

const ESTILO = [
  { emoji: '🌱', color: 'var(--color-lavanda)', texto: 'text-bosque', alto: 'h-16' },
  { emoji: '🌿', color: 'var(--color-arcilla)', texto: 'text-bosque', alto: 'h-28' },
  { emoji: '🌳', color: 'var(--color-bosque)', texto: 'text-crema', alto: 'h-40' },
]

/** Texto con **negritas** simples. */
function Rico({ t }: { t: string }) {
  return <>{t.split(/(\*\*[^*]+\*\*)/g).map((p, i) => p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>)}</>
}

export default function Propuesta() {
  const { config } = useConfig()
  const t = propuestaCompleta(config.propuesta)
  const ig = urlInstagram(config.festival.instagram_url)
  const tg = config.festival.telegram_url || 'https://t.me/miceliacomunidad'
  return (
    <div className="space-y-10">
      <section className="-mx-4 -mt-6 bg-bosque px-4 py-12 text-center text-crema sm:rounded-b-[2.5rem]">
        <div className="mx-auto max-w-2xl space-y-4">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-tierra">{t.kicker}</p>
          <h1 className="text-4xl font-bold sm:text-5xl">{t.titulo}</h1>
          <p className="text-lg text-crema/90">{t.subtitulo}</p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl space-y-4 text-lg">
        <p className="whitespace-pre-line"><Rico t={t.intro} /></p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl bg-tierra/50 p-5">
            <p className="text-sm font-bold uppercase tracking-wide text-bosque/70">{t.manana_titulo}</p>
            <p className="mt-1 font-semibold">{t.manana_texto}</p>
          </div>
          <div className="rounded-3xl bg-arcilla/30 p-5">
            <p className="text-sm font-bold uppercase tracking-wide text-bosque/70">{t.tarde_titulo}</p>
            <p className="mt-1 font-semibold">{t.tarde_texto}</p>
          </div>
        </div>
        <p className="whitespace-pre-line"><Rico t={t.invitacion} /></p>
      </section>

      <section aria-labelledby="niveles" className="space-y-6">
        <h2 id="niveles" className="text-center text-3xl font-bold">{t.niveles_titulo}</h2>
        <div className="mx-auto hidden max-w-3xl items-end justify-center gap-4 md:flex" aria-hidden="true">
          {t.niveles.map((n, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-4xl">{ESTILO[i].emoji}</span>
              <div className={`w-full rounded-t-3xl ${ESTILO[i].alto}`} style={{ background: ESTILO[i].color }} />
              <span className="text-sm font-bold uppercase tracking-wide">{i + 1} · {n.nombre}</span>
            </div>
          ))}
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {t.niveles.map((n, i) => (
            <li key={i} className="flex flex-col overflow-hidden rounded-3xl bg-superficie shadow-sm ring-1 ring-secundario/60">
              <div className={`px-5 py-4 ${ESTILO[i].texto}`} style={{ background: ESTILO[i].color }}>
                <p className="text-3xl" aria-hidden="true">{ESTILO[i].emoji}</p>
                <h3 className="text-2xl font-bold">Nivel {n.nombre}</h3>
                {n.para && <p className="text-sm font-semibold opacity-90">{n.para}</p>}
              </div>
              <div className="flex-1 space-y-4 p-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-bosque/60">Aportás</p>
                  <ul className="mt-1 space-y-1">{lineas(n.aportas).map((a) => <li key={a}>• {a}</li>)}</ul>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-bosque/60">Recibís de Micelia</p>
                  <ul className="mt-1 space-y-1">{lineas(n.recibis).map((a) => <li key={a}>✓ {a}</li>)}</ul>
                </div>
                {n.nota && <p className="rounded-2xl bg-alerta/20 px-3 py-2 text-sm font-semibold">⏰ {n.nota}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-superficie p-6 ring-1 ring-secundario/60">
          <h2 className="text-xl font-bold">{t.stand_titulo}</h2>
          <ul className="mt-3 grid gap-1 sm:grid-cols-2">{lineas(t.stand_traer).map((x) => <li key={x}>☐ {x}</li>)}</ul>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl bg-superficie p-6 ring-1 ring-secundario/60">
            <h2 className="text-xl font-bold">{t.brinda_titulo}</h2>
            <ul className="mt-3 space-y-1">{lineas(t.brinda).map((x) => <li key={x}>✓ {x}</li>)}</ul>
          </div>
          {t.lluvia && <div className="rounded-3xl bg-lavanda/40 p-6 font-bold">{t.lluvia}</div>}
        </div>
      </section>

      {config.sitio.mostrar_marcas && (
        <section className="space-y-4">
          <h2 className="text-center text-3xl font-bold">{t.marcas_titulo}</h2>
          <Marcas embebido />
        </section>
      )}

      <section className="mx-auto max-w-xl space-y-4 rounded-3xl bg-bosque p-8 text-center text-crema">
        <h2 className="text-2xl font-bold">{t.cta_titulo}</h2>
        <p className="text-crema/90">{t.cta_texto}</p>
        <Link to="/suma-tu-marca" className="inline-block rounded-2xl bg-acento px-8 py-4 text-lg font-bold uppercase tracking-wide text-bosque">{t.cta_boton}</Link>
        <p className="pt-2 text-sm text-crema/80">{t.cta_dudas}</p>
        <div className="flex justify-center gap-3">
          {ig && <BotonRed claro href={ig} etiqueta="Instagram de Micelia"><IconoInstagram /></BotonRed>}
          <BotonRed claro href={tg} etiqueta="Telegram de Micelia"><IconoTelegram /></BotonRed>
        </div>
      </section>
    </div>
  )
}
