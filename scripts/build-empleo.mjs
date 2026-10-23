// Empleo y salarios (trimestral) desde la API de Series de Tiempo.
// - SIPA (Secretaría de Trabajo): la API publica la serie con estacionalidad y la desestacionalizada → se usan ambas.
// - Cuentas nacionales (INDEC): solo serie original → la desestacionalizada se estima acá (descomposición clásica
//   multiplicativa con media móvil centrada 2x4). Se contrasta con la oficial del SIPA total.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchMonthly, control, gapsOf, ymIdx } from './build-emae.mjs'
import { BLOCKS } from './empleo-config.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'src', 'data', 'empleo.json')
const CACHE = path.join(ROOT, 'data', 'empleo-cache.json')
const OVERRIDES = path.join(ROOT, 'data', 'series-overrides.json')
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch { return d } }
const slug = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 36)
const NOW = (() => { const n = new Date(); return n.getFullYear() * 12 + n.getMonth() })()

// 'YYYY-MM' (primer o último mes del trimestre) → 'YYYY-Qn'
export const qOf = (ym) => `${ym.slice(0, 4)}-Q${Math.floor((+ym.slice(5, 7) - 1) / 3) + 1}`
export const qIdx = (q) => +q.slice(0, 4) * 4 + (+q[6] - 1)
export const idxQ = (i) => `${Math.floor(i / 4)}-Q${(i % 4) + 1}`

/** Desestacionalización clásica multiplicativa trimestral. y: positivos y consecutivos; firstQ: trimestre (0-3) de y[0]. */
export function seasonalAdjustQ(y, firstQ) {
  const n = y.length
  if (n < 20 || y.some((v) => !(v > 0))) return null
  const ratio = new Array(n).fill(null)
  for (let t = 2; t < n - 2; t++) {
    const ma = (0.5 * y[t - 2] + y[t - 1] + y[t] + y[t + 1] + 0.5 * y[t + 2]) / 4
    ratio[t] = Math.min(1.5, Math.max(0.5, y[t] / ma))
  }
  const f = new Array(4).fill(1)
  for (let q = 0; q < 4; q++) {
    const r = []
    for (let t = 0; t < n; t++) if (ratio[t] != null && (firstQ + t) % 4 === q) r.push(ratio[t])
    const last = r.slice(-10).sort((a, b) => a - b)
    const tr = last.length >= 5 ? last.slice(1, -1) : last
    f[q] = tr.length ? tr.reduce((a, b) => a + b, 0) / tr.length : 1
  }
  const mean = f.reduce((a, b) => a + b, 0) / 4
  return y.map((v, t) => v / (f[(firstQ + t) % 4] / mean))
}

// igual que en EMAE/IPI: interpola huecos (en logaritmos) solo para estimar factores; la salida respeta los huecos
export function adjustArrayQ(arr, periods) {
  const first = arr.findIndex((v) => v != null)
  let last = arr.length - 1
  while (last >= 0 && arr[last] == null) last--
  if (first < 0 || last - first + 1 < 20) return null
  const seg = arr.slice(first, last + 1)
  if (seg.filter((v) => v == null).length / seg.length > 0.25 || seg.some((v) => v != null && !(v > 0))) return null
  const filled = seg.slice()
  for (let i = 0; i < filled.length; i++) {
    if (filled[i] != null) continue
    const a = i - 1; let b = i + 1
    while (filled[b] == null) b++
    const w = (i - a) / (b - a)
    filled[i] = Math.exp(Math.log(filled[a]) * (1 - w) + Math.log(filled[b]) * w)
  }
  const sa = seasonalAdjustQ(filled, +periods[first][6] - 1)
  if (!sa) return null
  const out = new Array(arr.length).fill(null)
  sa.forEach((v, i) => { if (seg[i] != null) out[first + i] = +v.toFixed(4) })
  return out
}

const ROWS = BLOCKS.flatMap((b) => b.rows.map(([label, id, level, head, saId]) => ({ key: `${b.id}_${slug(label)}`, label, group: b.group, unit: b.unit, level, head: !!head, id, saId })))
const dup = ROWS.map((r) => r.key).filter((k, i, a) => a.indexOf(k) !== i)
if (dup.length) throw new Error('claves duplicadas en empleo-config: ' + dup.join(', '))

async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]) } }))
  return out
}

async function run() {
  const overrides = readJSON(OVERRIDES, {})
  const cache = readJSON(CACHE, { raw: {} })
  const log = []
  const get = async (id) => {
    if (!id) return null
    try {
      const h = await fetchMonthly(id)
      if (!h) return { id, status: 'missing' }
      if (/variaci[oó]n|porcentual/i.test(h.units)) return { id, status: 'rejected', units: h.units }
      // pasar claves 'YYYY-MM' a trimestres
      const map = {}
      for (const [k, v] of Object.entries(h.map)) map[qOf(k)] = v
      return { ...h, map, lastQ: qOf(h.last), status: ymIdx(h.last) < NOW - 24 ? 'stale' : 'ok' }
    } catch { return cache.raw?.[id] ? { ...cache.raw[id], status: 'cache' } : { id, status: 'error' } }
  }

  const raw = await pool(ROWS, 6, async (r) => ({ orig: await get(overrides[r.key] ?? r.id), sa: r.saId ? await get(overrides[`${r.key}_sa`] ?? r.saId) : null }))

  let min = Infinity, max = -Infinity
  for (const r of raw) for (const h of [r.orig, r.sa]) for (const k of Object.keys(h?.map ?? {})) { const i = qIdx(k); min = Math.min(min, i); max = Math.max(max, i) }
  const periods = Number.isFinite(min) ? Array.from({ length: max - min + 1 }, (_, i) => idxQ(min + i)) : []
  const align = (h) => (h?.map ? periods.map((p) => (p in h.map ? h.map[p] : null)) : null)

  let ctrl = null
  const series = ROWS.map((r, k) => {
    const o = raw[k].orig, s = raw[k].sa
    const orig = align(o)
    let sa = null, saKind = null
    if (orig) {
      if (s?.map) { sa = align(s); saKind = 'oficial' }
      else { sa = adjustArrayQ(orig, periods); saKind = sa ? 'propia' : null }
    }
    if (r.saId && orig && sa && saKind === 'oficial' && r.head) { const own = adjustArrayQ(orig, periods); if (own) ctrl = control(own, sa) }
    const gaps = orig ? gapsOf(orig, periods) : []
    log.push(`${(o?.status ?? 'missing').padEnd(8)} ${r.key.padEnd(44)} ${o?.id ?? r.id}${o?.nulls?.length ? `  API-null:${o.nulls.length}` : ''}${gaps.length ? `  FALTAN:${gaps.length}` : ''}`)
    return {
      key: r.key, label: r.label, group: r.group, unit: r.unit, level: r.level, head: r.head, id: o?.id ?? r.id, status: o?.status ?? 'missing',
      title: o?.title ?? null, apiUnits: o?.units ?? null, last: o?.lastQ ?? null, saId: s?.id ?? null, saKind, orig, sa, gaps, filled: [], apiNulls: o?.nulls?.length ?? 0,
    }
  })

  const ok = series.filter((x) => x.orig).length
  const meta = { fetchedAt: new Date().toISOString(), total: series.length, ok, start: periods[0] ?? null, end: periods.at(-1) ?? null, control: ctrl }
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify({ meta, months: periods, series }))

  const fresh = {}
  for (const r of raw) for (const h of [r.orig, r.sa]) if (h?.map && ['ok', 'stale'].includes(h.status)) fresh[h.id] = { id: h.id, map: h.map, last: h.last, lastQ: h.lastQ, title: h.title, units: h.units }
  if (Object.keys(fresh).length) { try { fs.writeFileSync(CACHE, JSON.stringify({ fetchedAt: meta.fetchedAt, raw: { ...cache.raw, ...fresh } })) } catch {} }

  console.log(`[econsur] Empleo y salarios → ${path.relative(ROOT, OUT)} | ${ok}/${series.length} series | ${meta.start ?? '—'} a ${meta.end ?? '—'}${ctrl ? ` | control SA propia vs oficial (SIPA total): corr ${ctrl.corr}` : ''}`)
  const bad = series.filter((x) => !x.orig)
  if (series.some((x) => x.gaps.length)) console.log(`[econsur] Empleo con trimestres faltantes en la API: ${series.filter((x) => x.gaps.length).length} series`)
  if (bad.length) console.log(`[econsur] Empleo sin datos (${bad.length}): ${bad.map((x) => x.key).join(', ')} (fijá el ID en data/series-overrides.json)`)
  if (process.env.SERIES_VERBOSE) console.log(log.join('\n'))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((e) => {
    console.warn('[econsur] no se pudo actualizar Empleo y salarios:', e.message)
    if (!fs.existsSync(OUT)) {
      fs.mkdirSync(path.dirname(OUT), { recursive: true })
      fs.writeFileSync(OUT, JSON.stringify({ meta: { fetchedAt: null, ok: 0, total: ROWS.length }, months: [], series: [] }))
    }
  })
}
