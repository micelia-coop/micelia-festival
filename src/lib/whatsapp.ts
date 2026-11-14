/** Normaliza un número argentino para wa.me (549 + código de área + número). */
export function numeroWa(n?: string | null): string | null {
  if (!n) return null
  let d = n.replace(/\D/g, '')
  if (!d) return null
  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('54')) d = d.slice(2)
  if (d.startsWith('9')) d = d.slice(1)
  if (d.startsWith('0')) d = d.slice(1)
  d = d.replace(/^(\d{2,4})15(\d{6,8})$/, '$1$2') // saca el 15 del celular
  return '549' + d
}

export function linkWa(numero: string | null | undefined, texto: string): string {
  const n = numeroWa(numero)
  const q = encodeURIComponent(texto)
  return n ? `https://wa.me/${n}?text=${q}` : `https://wa.me/?text=${q}`
}

export const origen = () => window.location.origin
