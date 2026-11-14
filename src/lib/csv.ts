export function descargarCsv(nombre: string, filas: Record<string, unknown>[]) {
  if (!filas.length) return
  const cols = Object.keys(filas[0])
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = '﻿' + [cols.join(','), ...filas.map((f) => cols.map((c) => esc(f[c])).join(','))].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = nombre
  a.click()
  URL.revokeObjectURL(a.href)
}
