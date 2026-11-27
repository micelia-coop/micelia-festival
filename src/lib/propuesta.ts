/** Textos de la página "Marcas aliadas" (propuesta). Se guardan en config 'propuesta'; esto es el valor por defecto. */
export type NivelTxt = { nombre: string; para: string; aportas: string; recibis: string; nota: string }
export type PropuestaTxt = {
  kicker: string; titulo: string; subtitulo: string; intro: string
  manana_titulo: string; manana_texto: string; tarde_titulo: string; tarde_texto: string
  invitacion: string; niveles_titulo: string; niveles: NivelTxt[]
  stand_titulo: string; stand_traer: string; brinda_titulo: string; brinda: string; lluvia: string
  marcas_titulo: string; cta_titulo: string; cta_texto: string; cta_boton: string; cta_dudas: string
  mensaje_invitacion: string
}

export const PROPUESTA_DEFAULT: PropuestaTxt = {
  kicker: 'Marcas aliadas',
  titulo: 'Sé parte del Festival de Solsticio',
  subtitulo: 'Sábado 19 de diciembre · Una casona con parque en Guaymallén, Mendoza',
  intro: '**Micelia** es una cooperativa de trabajo de mujeres. Estamos armando el **Festival de Solsticio**: un día de arte, música, juegos, magia, comiditas ricas y marcas con sentido.',
  manana_titulo: 'Por la mañana', manana_texto: 'Yoga y cierre consciente de solsticio',
  tarde_titulo: 'Por la tarde', tarde_texto: 'El festival, con cierre artístico',
  invitacion: 'Nos encantaría que tu proyecto sea parte. Estos son los niveles para sumarte:',
  niveles_titulo: 'Niveles para ser parte',
  niveles: [
    { nombre: 'Semilla', para: 'Solo para sponsors', aportas: 'Un premio o regalo para el sorteo\nVenta de 3 entradas', recibis: 'Publicidad en redes de Micelia y de nuestras 5 marcas', nota: '' },
    { nombre: 'Raíz', para: 'Para sponsors y para quien quiera brindar una actividad', aportas: '$ 10.000\n1 posteo en redes en colaboración con Micelia\nOpcional: un regalo para el sorteo', recibis: 'Mención en redes\nMención en el banner general\nDifusión en el Telegram de Micelia\n1 actividad o taller (1 hora máximo)', nota: '' },
    { nombre: 'Copa', para: 'Con stand en el festival', aportas: '$ 15.000\n1 posteo en redes en colaboración con Micelia\nOpcional: un regalo para el sorteo', recibis: 'Stand en el festival\nMención en redes\nMención en el banner general\nDifusión en el Telegram de Micelia', nota: 'Se solicita presencia en el stand de 12 a 20 hs.' },
  ],
  stand_titulo: '🌳 Si tenés stand (nivel Copa), traé:',
  stand_traer: 'Gazebo\nMesa o perchero (lo que necesites para exhibir)\nMantel\nSilla o banquito\nLuminaria (opcional)\nDecoración (opcional)\nMercadería con precio\nCartelería con alias y medios de pago\nLogo de la marca visible en el stand',
  brinda_titulo: 'Micelia te brinda',
  brinda: 'Agua caliente (para el mate 🧉)\nAgua fría\nBaños',
  lluvia: '☔ El festival no se suspende por lluvia.',
  marcas_titulo: 'Nuestras marcas aliadas',
  cta_titulo: '¿Querés ser parte?',
  cta_texto: 'Contanos sobre tu marca o proyecto y qué nivel te interesa. El equipo de Alianzas te escribe. 🌿',
  cta_boton: 'Postularme',
  cta_dudas: '¿Dudas? Escribinos:',
  mensaje_invitacion: 'Hola {nombre}. Con Micelia, una cooperativa de trabajo de mujeres, estamos armando el Festival de Solsticio el sábado 19/12 en una casona con parque en Guaymallén. Va a ser un día de arte, música, juegos, magia, comiditas ricas y marcas con sentido, con yoga y cierre consciente de solsticio por la mañana, y el festival con cierre artístico por la tarde.\n\nNos encantaría que {proyecto} sea parte como sponsor. Acá te cuento qué recibe tu comunidad y cómo sumarte, con los niveles Semilla, Raíz y Copa: {link}\n\n¿Te parece que lo conversemos esta semana?',
}

/** Mezcla lo guardado con los valores por defecto (para que nunca falte un texto). */
export function propuestaCompleta(v: unknown): PropuestaTxt {
  const g = (v && typeof v === 'object' ? v : {}) as Partial<PropuestaTxt>
  const niveles = PROPUESTA_DEFAULT.niveles.map((n, i) => ({ ...n, ...(g.niveles?.[i] ?? {}) }))
  return { ...PROPUESTA_DEFAULT, ...g, niveles }
}

export const lineas = (t: string) => t.split('\n').map((x) => x.trim()).filter(Boolean)
