// Utilidades de exportación CSV: separador ";" y decimal con coma (se abre bien en Excel en español), UTF-8 con BOM.
const esc = (v) => {
  if (v == null || v === '') return ''
  if (typeof v === 'number') return Number.isFinite(v) ? String(Math.round(v * 1e6) / 1e6).replace('.', ',') : ''
  const s = String(v)
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
export const stamp = () => new Date().toISOString().slice(0, 10)
// Valor numérico de una celda {v,k}: las variaciones en % se exportan en puntos de % (0,031 → 3,1)
export const val = (c) => (c == null || c.v == null ? null : c.k === 'pct' ? c.v * 100 : c.v)

export function downloadCSV(filename, rows) {
  const csv = rows.map((r) => r.map(esc).join(';')).join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }))
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
