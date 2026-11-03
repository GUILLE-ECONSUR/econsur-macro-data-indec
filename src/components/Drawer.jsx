import { useEffect } from 'react'
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fmt, isNum } from '../format.js'

// Normaliza el texto de una unidad para comparar medidas ("var. % i.a." ≈ "var. % interanual")
const norm = (t) => String(t || '').toLowerCase()
  .replace(/\bi\.a\./g, 'interanual').replace(/\bm\.\s?s\.e\./g, 'mensual s.e.').replace(/\banual\b/g, 'interanual')
  .replace(/var\.?/g, '').replace(/[^a-z0-9%áéíóúñ.]+/g, ' ').replace(/\s+/g, ' ').trim()

const PERIOD_WORD = /^(mes|trim\.?|trimestre|semestre|a[nñ]o)\b/i // columna "último dato" rotulada con el tipo de período

// Último dato disponible para la serie de "Últimos períodos" de una línea (fila principal o su continuación).
//  1) misma medida: la unidad del "último dato" coincide con la de la serie (si el rótulo trae "a / b", la parte b va con la 2ª línea)
//  2) misma medida en "Variación" (interanual / acumulado) de la misma línea
//  3) otra medida pero igual tipo de dato (% / nivel): se grafica atenuado y se avisa
//  4) otra unidad (no comparable en el mismo eje): se informa debajo del gráfico sin barra
export function lastPoint(block, lines, ln, recentGroup) {
  const latest = block.groups.find((g) => g.name === 'latest')
  if (!latest) return null
  const change = block.groups.find((g) => g.name === 'change')
  const ru = norm(ln.u.recent || lines[0].u.recent || ln.u.ref || lines[0].u.ref)
  const kind = (ln.v.recent ?? []).find(isNum)?.k
  const periodOf = (j) => (latest.unitHeader ? latest.cols[j].label : latest.period || latest.cols[j].label)
  // texto de medida de la columna j para la línea m (rótulos combinados "nivel / variación" se reparten por línea)
  const measureOf = (m, j) => {
    if (latest.unitHeader) return m.u.latest
    const label = latest.cols[j].label
    if (!label.includes(' / ') && !label.includes('/')) return label
    const parts = label.split('/').map((x) => x.trim())
    return parts[Math.min(lines.indexOf(m), parts.length - 1)]
  }
  const cand = []
  lines.forEach((m) => latest.cols.forEach((_, j) => { const c = m.v.latest[j]; if (isNum(c)) cand.push({ m, j, c, measure: measureOf(m, j) }) }))

  let found = null
  const pick = (x, exact) => ({ cell: x.c, label: periodOf(x.j), measure: x.measure, exact })
  // 1) medida idéntica, o columna rotulada por tipo de período con el mismo tipo de dato
  const x1 = cand.find((x) => x.c.k === kind && (norm(x.measure) === ru || (PERIOD_WORD.test(x.measure) && x.j === 0 && x.m === ln)))
  if (x1) found = pick(x1, true)
  // 2) variación interanual / acumulada de la misma línea
  if (!found && change) {
    for (let j = 0; j < change.cols.length && !found; j++) {
      const c = ln.v.change?.[j]
      const lab = norm(change.cols[j].label)
      if (isNum(c) && c.k === kind && ((ru.includes('interanual') && lab.includes('interanual')) || (ru.includes('acum') && lab.includes('acum')))) {
        found = { cell: c, label: periodOf(0), measure: `${change.cols[j].label} ${ln.u.change || ''}`.trim(), exact: true }
      }
    }
  }
  // 3) mismo tipo de dato, otra medida
  if (!found) { const x3 = cand.find((x) => x.c.k === kind); if (x3) found = pick(x3, false) }
  // 4) otra unidad: solo se informa
  if (!found && cand.length) { const x4 = cand.find((x) => x.m === ln) ?? cand[0]; found = { ...pick(x4, false), asNote: true } }
  // si el período ya es la última barra de "Últimos períodos", no se repite
  if (found && recentGroup.cols.at(-1)?.label === found.label) return null
  return found
}

function Chart({ title, unit, cols, cells, extra }) {
  const data = cols.map((c, i) => ({ label: c.label, v: isNum(cells[i]) ? cells[i].v : null, cell: cells[i], last: false }))
  if (extra && !extra.asNote) data.push({ label: extra.label, v: extra.cell.v, cell: extra.cell, last: true })
  if (data.every((d) => d.v == null)) return null
  const kind = data.find((d) => d.cell?.k)?.cell.k
  const tick = (v) => fmt({ v, k: kind })
  return (
    <figure className="chart">
      <figcaption><b>{title}</b>{unit ? <span> · {unit}</span> : null}</figcaption>
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted)' }} tickLine={false} axisLine={{ stroke: 'var(--line)' }} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} tickLine={false} axisLine={false} width={64} tickFormatter={tick} />
          <Tooltip formatter={(v, _n, e) => [tick(v), e?.payload?.last ? 'Último dato' : 'Valor']} cursor={{ fill: 'var(--accent-soft)' }}
            contentStyle={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 6, fontSize: 12 }} />
          <ReferenceLine y={0} stroke="var(--line)" />
          <Bar dataKey="v" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.last ? 'var(--sun)' : d.v != null && d.v < 0 ? 'var(--neg)' : 'var(--accent)'} fillOpacity={d.last && !extra?.exact ? 0.55 : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {extra && (
        <p className="chart-note">
          <i className="dot" /> Último dato disponible: {extra.label}
          {extra.asNote ? <> · <b>{fmt(extra.cell)}</b></> : null}
          {extra.measure ? <> · <span>{extra.measure}</span></> : null}
          {extra.asNote ? <> · <b>otra unidad: no se grafica en este eje</b></> : !extra.exact ? <> · <b>medida distinta a la de la serie</b></> : null}
        </p>
      )}
    </figure>
  )
}

export default function Drawer({ sel, onClose }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  if (!sel) return null
  const { block, row } = sel
  // Una fila principal + sus continuaciones (p. ej. "var. % i.a." y "var. % mensual s.e.")
  const idx = block.rows.indexOf(row)
  let start = idx
  while (start > 0 && block.rows[start].cont) start--
  const lines = [block.rows[start]]
  for (let i = start + 1; i < block.rows.length && block.rows[i].cont; i++) lines.push(block.rows[i])
  const main = lines[0]

  return (
    <div className="scrim" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-label={main.label} onClick={(e) => e.stopPropagation()}>
        <header>
          <div>
            <p className="crumb">{block.title}</p>
            <h2>{main.label}</h2>
          </div>
          <button className="close" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>
        {lines.map((ln, li) =>
          block.groups
            .filter((g) => g.name === 'ref' || g.name === 'recent')
            .map((g) => (
              <Chart key={`${li}${g.name}`} title={g.name === 'ref' ? 'Referencia' : 'Últimos períodos'}
                unit={ln.u[g.name] || main.u[g.name]} cols={g.cols} cells={ln.v[g.name]}
                extra={g.name === 'recent' ? lastPoint(block, lines, ln, g) : null} />
            )),
        )}
        <dl className="latest">
          {block.groups.filter((g) => g.name === 'latest' || g.name === 'change').flatMap((g) =>
            lines.flatMap((ln) => ln.v[g.name].map((c, i) => isNum(c) && (
              <div key={g.name + i + ln.u[g.name]}>
                <dt>{g.name === 'latest' && g.period ? `${g.cols[i].label} · ${g.period}` : g.cols[i].label}</dt>
                <dd>{fmt(c)}</dd>
              </div>
            ))),
          )}
        </dl>
      </aside>
    </div>
  )
}
