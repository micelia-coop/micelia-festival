import { Link } from 'react-router-dom'
import { BotonRed, IconoInstagram, IconoTelegram, urlInstagram } from '../../components/Iconos'
import { useConfig } from '../../lib/config'
import Marcas from './Marcas'

type Nivel = {
  nombre: string; emoji: string; color: string; texto: string; para: string
  aportas: string[]; recibis: string[]; nota?: string; alto: string
}

const NIVELES: Nivel[] = [
  {
    nombre: 'Semilla', emoji: '🌱', color: 'var(--color-lavanda)', texto: 'text-bosque', alto: 'h-16',
    para: 'Solo para sponsors',
    aportas: ['Un premio o regalo para el sorteo', 'Venta de 3 entradas'],
    recibis: ['Publicidad en redes de Micelia y de nuestras 5 marcas'],
  },
  {
    nombre: 'Raíz', emoji: '🌿', color: 'var(--color-arcilla)', texto: 'text-bosque', alto: 'h-28',
    para: 'Para sponsors y para quien quiera brindar una actividad',
    aportas: ['$ 10.000', '1 posteo en redes en colaboración con Micelia', 'Opcional: un regalo para el sorteo'],
    recibis: ['Mención en redes', 'Mención en el banner general', 'Difusión en el Telegram de Micelia', '1 actividad o taller (1 hora máximo)'],
  },
  {
    nombre: 'Copa', emoji: '🌳', color: 'var(--color-bosque)', texto: 'text-crema', alto: 'h-40',
    para: 'Con stand en el festival',
    aportas: ['$ 15.000', '1 posteo en redes en colaboración con Micelia', 'Opcional: un regalo para el sorteo'],
    recibis: ['Stand en el festival', 'Mención en redes', 'Mención en el banner general', 'Difusión en el Telegram de Micelia'],
    nota: 'Se solicita presencia en el stand de 12 a 20 hs.',
  },
]

const STAND_TRAER = [
  'Gazebo', 'Mesa o perchero (lo que necesites para exhibir)', 'Mantel', 'Silla o banquito', 'Luminaria (opcional)',
  'Decoración (opcional)', 'Mercadería con precio', 'Cartelería con alias y medios de pago', 'Logo de la marca visible en el stand',
]
const MICELIA_BRINDA = ['Agua caliente (para el mate 🧉)', 'Agua fría', 'Baños']

export default function Propuesta() {
  const { config } = useConfig()
  const ig = urlInstagram(config.festival.instagram_url)
  const tg = config.festival.telegram_url || 'https://t.me/miceliacomunidad'
  return (
    <div className="space-y-10">
      <section className="-mx-4 -mt-6 bg-bosque px-4 py-12 text-center text-crema sm:rounded-b-[2.5rem]">
        <div className="mx-auto max-w-2xl space-y-4">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-tierra">Marcas aliadas</p>
          <h1 className="text-4xl font-bold sm:text-5xl">Sé parte del Festival de Solsticio</h1>
          <p className="text-lg text-crema/90">Sábado 19 de diciembre · Una casona con parque en Guaymallén, Mendoza</p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl space-y-4 text-lg">
        <p><strong>Micelia</strong> es una cooperativa de trabajo de mujeres. Estamos armando el <strong>Festival de Solsticio</strong>: un día de arte, música, juegos, magia, comiditas ricas y marcas con sentido.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl bg-tierra/50 p-5">
            <p className="text-sm font-bold uppercase tracking-wide text-bosque/70">Por la mañana</p>
            <p className="mt-1 font-semibold">Yoga y cierre consciente de solsticio</p>
          </div>
          <div className="rounded-3xl bg-arcilla/30 p-5">
            <p className="text-sm font-bold uppercase tracking-wide text-bosque/70">Por la tarde</p>
            <p className="mt-1 font-semibold">El festival, con cierre artístico</p>
          </div>
        </div>
        <p>Nos encantaría que tu proyecto sea parte. Estos son los niveles para sumarte:</p>
      </section>

      {/* Diagrama de niveles: crece de semilla a copa */}
      <section aria-labelledby="niveles" className="space-y-6">
        <h2 id="niveles" className="text-center text-3xl font-bold">Niveles para ser parte</h2>
        <div className="mx-auto hidden max-w-3xl items-end justify-center gap-4 md:flex" aria-hidden="true">
          {NIVELES.map((n, i) => (
            <div key={n.nombre} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-4xl">{n.emoji}</span>
              <div className={`w-full rounded-t-3xl ${n.alto}`} style={{ background: n.color }} />
              <span className="text-sm font-bold uppercase tracking-wide">{i + 1} · {n.nombre}</span>
            </div>
          ))}
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {NIVELES.map((n) => (
            <li key={n.nombre} className="flex flex-col overflow-hidden rounded-3xl bg-superficie shadow-sm ring-1 ring-secundario/60">
              <div className={`px-5 py-4 ${n.texto}`} style={{ background: n.color }}>
                <p className="text-3xl" aria-hidden="true">{n.emoji}</p>
                <h3 className="text-2xl font-bold">Nivel {n.nombre}</h3>
                <p className="text-sm font-semibold opacity-90">{n.para}</p>
              </div>
              <div className="flex-1 space-y-4 p-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-bosque/60">Aportás</p>
                  <ul className="mt-1 space-y-1">{n.aportas.map((a) => <li key={a}>• {a}</li>)}</ul>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-bosque/60">Recibís de Micelia</p>
                  <ul className="mt-1 space-y-1">{n.recibis.map((a) => <li key={a}>✓ {a}</li>)}</ul>
                </div>
                {n.nota && <p className="rounded-2xl bg-alerta/20 px-3 py-2 text-sm font-semibold">⏰ {n.nota}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-superficie p-6 ring-1 ring-secundario/60">
          <h2 className="text-xl font-bold">🌳 Si tenés stand (nivel Copa), traé:</h2>
          <ul className="mt-3 grid gap-1 sm:grid-cols-2">{STAND_TRAER.map((t) => <li key={t}>☐ {t}</li>)}</ul>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl bg-superficie p-6 ring-1 ring-secundario/60">
            <h2 className="text-xl font-bold">Micelia te brinda</h2>
            <ul className="mt-3 space-y-1">{MICELIA_BRINDA.map((t) => <li key={t}>✓ {t}</li>)}</ul>
          </div>
          <div className="rounded-3xl bg-lavanda/40 p-6 font-bold">☔ El festival no se suspende por lluvia.</div>
        </div>
      </section>

      {config.sitio.mostrar_marcas && (
        <section className="space-y-4">
          <h2 className="text-center text-3xl font-bold">Nuestras marcas aliadas</h2>
          <Marcas embebido />
        </section>
      )}

      <section className="mx-auto max-w-xl space-y-4 rounded-3xl bg-bosque p-8 text-center text-crema">
        <h2 className="text-2xl font-bold">¿Querés ser parte?</h2>
        <p className="text-crema/90">Contanos sobre tu marca o proyecto y qué nivel te interesa. El equipo de Alianzas te escribe. 🌿</p>
        <Link to="/suma-tu-marca" className="inline-block rounded-2xl bg-acento px-8 py-4 text-lg font-bold uppercase tracking-wide text-bosque">Postularme</Link>
        <p className="pt-2 text-sm text-crema/80">¿Dudas? Escribinos:</p>
        <div className="flex justify-center gap-3">
          {ig && <BotonRed claro href={ig} etiqueta="Instagram de Micelia"><IconoInstagram /></BotonRed>}
          <BotonRed claro href={tg} etiqueta="Telegram de Micelia"><IconoTelegram /></BotonRed>
        </div>
      </section>
    </div>
  )
}
