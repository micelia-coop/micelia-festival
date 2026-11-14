import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

type Variante = 'primario' | 'acento' | 'suave' | 'borde' | 'peligro' | 'exito'
const VAR: Record<Variante, string> = {
  primario: 'bg-primario text-white hover:bg-bosque/90',
  acento: 'bg-acento text-bosque hover:bg-acento/85',
  suave: 'bg-secundario/50 text-bosque hover:bg-secundario/70',
  borde: 'border-2 border-bosque text-bosque bg-transparent hover:bg-bosque/5',
  peligro: 'bg-error text-white hover:bg-error/90',
  exito: 'bg-exito text-white hover:bg-exito/90',
}
const base = 'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-bold transition disabled:opacity-50 disabled:pointer-events-none'

export function Button({ variante = 'primario', className, grande, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; grande?: boolean }) {
  return <button {...p} className={cx(base, VAR[variante], grande && 'w-full py-4 text-lg', className)} />
}

export function LinkButton({ to, variante = 'primario', className, children, externo }: { to: string; variante?: Variante; className?: string; children: ReactNode; externo?: boolean }) {
  const cls = cx(base, VAR[variante], className)
  if (externo || /^https?:/.test(to)) return <a href={to} target="_blank" rel="noreferrer" className={cls}>{children}</a>
  return <Link to={to} className={cls}>{children}</Link>
}

export function Card({ className, children, acento }: { className?: string; children: ReactNode; acento?: string }) {
  return (
    <div className={cx('rounded-3xl bg-superficie p-5 shadow-sm ring-1 ring-secundario/60', className)}
      style={acento ? { borderTop: `6px solid ${acento}` } : undefined}>
      {children}
    </div>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-bold">{label}</span>
      {children}
      {hint && <span className="block text-xs text-bosque/70">{hint}</span>}
    </label>
  )
}

const inputCls = 'w-full rounded-xl border-2 border-secundario bg-white px-4 py-3 text-base focus:border-bosque focus:outline-none'
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(inputCls, p.className)} />
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={3} {...p} className={cx(inputCls, p.className)} />
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx(inputCls, p.className)} />

export function Alerta({ tipo = 'info', children }: { tipo?: 'info' | 'exito' | 'alerta' | 'error'; children: ReactNode }) {
  const c = { info: 'bg-secundario/40 text-bosque', exito: 'bg-exito text-white', alerta: 'bg-alerta text-bosque', error: 'bg-error text-white' }[tipo]
  return <div role={tipo === 'error' ? 'alert' : 'status'} className={cx('rounded-2xl px-4 py-3 text-sm font-semibold', c)}>{children}</div>
}

export function Badge({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span className="inline-block rounded-full px-3 py-1 text-xs font-bold"
      style={{ background: color ?? 'var(--color-secundario)', color: color ? '#fff' : 'var(--color-bosque)' }}>
      {children}
    </span>
  )
}

export function Spinner({ texto = 'Cargando…' }: { texto?: string }) {
  return <p className="py-10 text-center text-bosque/70" aria-live="polite">{texto}</p>
}

export function Titulo({ children, bajada, acento }: { children: ReactNode; bajada?: ReactNode; acento?: string }) {
  return (
    <header className="mb-6 space-y-2">
      <div className="h-1.5 w-14 rounded-full" style={{ background: acento ?? 'var(--color-acento)' }} />
      <h1 className="text-3xl font-bold sm:text-4xl">{children}</h1>
      {bajada && <p className="text-lg text-bosque/80">{bajada}</p>}
    </header>
  )
}

export { cx }
