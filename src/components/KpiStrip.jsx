import { fmt, isNum, tone } from '../format.js'

// Indicadores destacados: se buscan por nombre en la hoja principal, así sobreviven a cambios de fila.
// variation: true → la tarjeta muestra una variación % (aunque la fila principal sea un nivel)
const PICKS = [
  { re: /estimador mensual de actividad/i, name: 'Actividad (EMAE)' },
  { re: /\(ipi\) manufacturero/i, name: 'IPI manufacturero', variation: true },
  { re: /\(isac\)/i, name: 'ISAC (construcción)', variation: true },
  { re: /ventas totales en supermercados/i, name: 'Supermercados (ventas reales)', variation: true, prefer: /real/i },
  { re: /precios al consumidor/i, name: 'Inflación (IPC)' },
  { re: /\(ipim\)/i, name: 'IPIM (precios mayoristas)', variation: true },
  { re: /^producto interno bruto/i, name: 'PIB' },
  { re: /tasa de desocupaci/i, name: 'Desocupación' },
  { re: /^pobreza/i, name: 'Pobreza' },
  { re: /saldo comercial/i, name: 'Saldo comercial' },
  { re: /^índice de salarios/i, name: 'Salarios' },
  { re: /canasta básica total/i, name: 'Canasta básica total' },
]

export function pickKpis(blocks) {
  const out = []
  for (const p of PICKS) {
    outer: for (const b of blocks) {
      for (const r of b.rows) {
        if (r.t === 'r' && !r.cont && p.re.test(r.label)) { out.push({ ...p, block: b, row: r }); break outer }
      }
    }
  }
  return out
}

const isPct = (c) => isNum(c) && c.k === 'pct'
function linesOf(block, row) {
  const i = block.rows.indexOf(row)
  const out = [row]
  for (let k = i + 1; k < block.rows.length && block.rows[k].cont; k++) out.push(block.rows[k])
  return out
}
// Tarjetas "en variaciones %": primero el último dato si ya es una variación %; si no, la variación interanual/acumulada
function headlineVar(block, row, prefer) {
  const lines = linesOf(block, row)
  // con `prefer`, las líneas cuya unidad coincide (p. ej. "real") van primero
  if (prefer) lines.sort((a, b) => Number(prefer.test(`${b.u.change} ${b.u.recent}`)) - Number(prefer.test(`${a.u.change} ${a.u.recent}`)))
  const latest = block.groups.find((g) => g.name === 'latest')
  const change = block.groups.find((g) => g.name === 'change')
  const period = latest?.cols[0]?.label
  for (const ln of lines) {
    const c = (ln.v.latest ?? []).find(isPct)
    if (c) return { cell: c, period, unit: ln.u.latest || latest.cols[0].label, line: ln }
  }
  for (const ln of lines) {
    const j = (ln.v.change ?? []).findIndex(isPct)
    if (j >= 0) return { cell: ln.v.change[j], period, unit: `${change.cols[j].label} · ${ln.u.change || ''}`.replace(/ · $/, ''), line: ln, skip: j }
  }
  return null
}

function headline(block, row) {
  // Primer valor numérico del grupo "último dato"; si no hay, el último de "últimos períodos"
  const latest = block.groups.find((g) => g.name === 'latest')
  const li = latest ? row.v.latest.findIndex(isNum) : -1
  if (li >= 0) return { cell: row.v.latest[li], period: latest.period || latest.cols[li].label, unit: row.u.latest || latest.cols[li].label }
  const rec = block.groups.find((g) => g.name === 'recent')
  const vals = row.v.recent ?? []
  for (let i = vals.length - 1; i >= 0; i--) if (isNum(vals[i])) return { cell: vals[i], period: rec.cols[i].label, unit: row.u.recent }
  return null
}

export default function KpiStrip({ items, onPick }) {
  return (
    <div className="kpis">
      {items.map(({ name, block, row, variation, prefer }) => {
        const h = variation ? headlineVar(block, row, prefer) : headline(block, row)
        if (!h) return null
        const change = block.groups.find((g) => g.name === 'change')
        const src = h.line ?? row // línea de la que salen los chips de variación
        return (
          <button key={name} className="kpi" onClick={() => onPick(block, row)}>
            <span className="kpi-name">{name}</span>
            <span className={`kpi-val ${tone(h.cell)}`}>{fmt(h.cell)}</span>
            <span className="kpi-meta">{h.unit} · {h.period}</span>
            <span className="kpi-chg">
              {change?.cols.map((c, i) => i !== h.skip && isNum(src.v.change[i]) && (
                <span key={i}><em>{c.label}</em> <b className={tone(src.v.change[i])}>{fmt(src.v.change[i])}</b></span>
              ))}
            </span>
          </button>
        )
      })}
    </div>
  )
}
