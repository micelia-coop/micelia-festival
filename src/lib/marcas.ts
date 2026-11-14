import { linkWa } from './whatsapp'

export function linkInstagram(ig?: string | null): string | null {
  if (!ig) return null
  if (/^https?:\/\//.test(ig)) return ig
  return `https://instagram.com/${ig.replace(/^@/, '').trim()}`
}
export function linkWeb(w?: string | null): string | null {
  if (!w) return null
  return /^https?:\/\//.test(w) ? w : `https://${w}`
}
export const pedirWa = (whatsapp: string | null | undefined, marca: string, producto?: string) =>
  whatsapp ? linkWa(whatsapp, `Hola ${marca}! Te encontré en la Guía de regalos de Micelia${producto ? ` y me interesa: ${producto}` : ''} 🌿`) : null
