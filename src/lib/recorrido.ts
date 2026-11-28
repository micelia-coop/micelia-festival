export type Tarjeta = { etiqueta: string; titulo: string; texto: string; link: string; color: string; visible?: boolean }

export const COLORES: { valor: string; nombre: string }[] = [
  { valor: 'lavanda', nombre: 'Lavanda' }, { valor: 'tierra', nombre: 'Tierra' }, { valor: 'arcilla', nombre: 'Arcilla' },
  { valor: 'amor', nombre: 'Amor' }, { valor: 'bosque', nombre: 'Bosque' },
]

export const LINKS: { valor: string; nombre: string }[] = [
  { valor: '/desafio', nombre: 'Desafío' }, { valor: '/entradas', nombre: 'Entradas' }, { valor: '/bolsa-ritual', nombre: 'Bolsa Ritual' },
  { valor: '/marcas-aliadas', nombre: 'Marcas aliadas' }, { valor: '/info', nombre: 'Info y FAQ' }, { valor: '', nombre: 'Sin link' },
]

export const RECORRIDO_DEFAULT: Tarjeta[] = [
  { link: '/desafio', color: 'lavanda', etiqueta: 'Desde el 28/11 · online y gratis', titulo: 'Desafío de Gratitud', texto: '21 días, un video por día. Sumate y empezá a preparar el ritual.' },
  { link: '/entradas', color: 'tierra', etiqueta: '19/12 · 8 a 12 hs · cupo 20', titulo: 'Mañana de yoga', texto: 'Práctica con Respira y Transfórmate. Incluye la tarde.' },
  { link: '/entradas', color: 'arcilla', etiqueta: '19/12 · desde las 13 hs', titulo: 'Festival de la tarde', texto: 'Marcas emprendedoras, actividades y comida.' },
  { link: '/bolsa-ritual', color: 'amor', etiqueta: 'Antes, durante y después', titulo: 'Bolsa Ritual', texto: 'Regalos conscientes de marcas emprendedoras para estas fiestas.' },
]

export function recorrido(v: unknown): Tarjeta[] {
  return Array.isArray(v) && v.length ? (v as Tarjeta[]) : RECORRIDO_DEFAULT
}
