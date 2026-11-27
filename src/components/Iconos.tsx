type P = { className?: string }

export const IconoInstagram = ({ className = 'size-6' }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
)

export const IconoTelegram = ({ className = 'size-6' }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M21.9 4.6 18.7 19.7c-.2 1.1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.2 13.4l-4.8-1.5c-1-.3-1-1 .2-1.5l18.9-7.3c.9-.3 1.6.2 1.4 1.5Z" />
  </svg>
)

/** Link válido de Instagram (ignora el genérico "instagram.com/"). */
export function urlInstagram(v?: string | null): string | null {
  if (!v) return null
  const t = v.trim()
  if (/^https?:\/\//.test(t)) return /instagram\.com\/?$/i.test(t) ? null : t
  const u = t.replace(/^@/, '')
  return u ? `https://instagram.com/${u}` : null
}

export function BotonRed({ href, etiqueta, children, claro }: { href: string; etiqueta: string; children: React.ReactNode; claro?: boolean }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label={etiqueta} title={etiqueta}
      className={`inline-flex size-11 items-center justify-center rounded-full transition ${claro ? 'bg-white/10 text-crema hover:bg-white/20' : 'bg-secundario/60 text-bosque hover:bg-secundario'}`}>
      {children}
    </a>
  )
}
