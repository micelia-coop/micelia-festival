export const TZ = 'America/Argentina/Mendoza'

const ars = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
export const pesos = (n: number | null | undefined) => (n == null ? '—' : ars.format(n))

export const fechaLarga = (d: string | Date) =>
  new Intl.DateTimeFormat('es-AR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(d))

export const fechaCorta = (d: string | Date) =>
  new Intl.DateTimeFormat('es-AR', { timeZone: TZ, day: 'numeric', month: 'numeric' }).format(new Date(d))

export const fechaHora = (d: string | Date) =>
  new Intl.DateTimeFormat('es-AR', { timeZone: TZ, day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d))

export const hora = (d: string | Date) =>
  new Intl.DateTimeFormat('es-AR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(d))

/** Fecha 'YYYY-MM-DD' (sin hora) → Date al mediodía de Mendoza, para no correr el día. */
export const diaLocal = (iso: string) => new Date(`${iso}T12:00:00-03:00`)
