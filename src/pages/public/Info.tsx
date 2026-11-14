import { Card, LinkButton, Titulo } from '../../components/ui'
import { useConfig } from '../../lib/config'
import { linkWa } from '../../lib/whatsapp'

export default function Info() {
  const { config } = useConfig()
  const f = config.festival
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Titulo bajada="Todo lo que necesitás saber para disfrutar el festival.">Info práctica</Titulo>
      <Card>
        <h2 className="text-xl font-bold">📍 Cómo llegar</h2>
        {f.lugar ? (
          <div className="mt-1 space-y-2"><p><strong>{f.lugar}</strong>{f.lugar_direccion ? ` · ${f.lugar_direccion}` : ''}</p>
            {f.lugar_maps_url && <LinkButton to={f.lugar_maps_url} variante="suave">Abrir en el mapa</LinkButton>}</div>
        ) : <p className="mt-1">El lugar se confirma muy pronto.</p>}
      </Card>
      <section className="space-y-2">
        <h2 className="text-2xl font-bold">Preguntas frecuentes</h2>
        {(config.faq ?? []).map((q) => (
          <details key={q.p} className="group rounded-2xl bg-superficie p-4 ring-1 ring-secundario/60">
            <summary className="cursor-pointer list-none font-bold">
              <span className="mr-2 inline-block transition group-open:rotate-90">›</span>{q.p}
            </summary>
            <p className="mt-2 whitespace-pre-line text-bosque/90">{q.r}</p>
          </details>
        ))}
      </section>
      {f.whatsapp_contacto && (
        <Card><h2 className="text-xl font-bold">¿Otra consulta?</h2>
          <LinkButton className="mt-2" to={linkWa(f.whatsapp_contacto, `Hola! Tengo una consulta sobre el ${f.nombre}`)}>Escribinos por WhatsApp</LinkButton></Card>
      )}
    </div>
  )
}
