// Trabajo (EPH) trimestral: tasas de desocupación, empleo y subocupación por región/aglomerado + población en niveles.
// La API no publica versiones desestacionalizadas de la EPH: se estiman acá (clásica multiplicativa trimestral).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchMonthly, gapsOf, ymIdx } from './build-emae.mjs'
import { qOf, qIdx, idxQ, adjustArrayQ } from './build-empleo.mjs'
import { GEO, MEASURES, POBLACION } from './trabajo-config.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'src', 'data', 'trabajo.json')
const CACHE = path.join(ROOT, 'data', 'trabajo-cache.json')
const OVERRIDES = path.join(ROOT, 'data', 'series-overrides.json')
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch { return d } }
const norm = (t) => String(t ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const NOW = (() => { const n = new Date(); return n.getFullYear() * 12 + n.getMonth() })()

const ROWS = [
  ...POBLACION.map(([label, id, level, head]) => ({ key: `pob_${norm(label).replace(/[^a-z0-9]+/g, '_')}`, label, group: 'Población (miles de personas) · total aglomerados', unit: 'miles de personas', type: 'level', level, head: !!head, id, match: null })),
  ...MEASURES.flatMap((m) => GEO.filter((g) => m.ids[g.k]).map((g) => ({
    key: `${m.id}_${g.k}`, label: g.label, group: m.group, unit: '%', type: 'rate', level: g.level, head: !!g.head, id: m.ids[g.k], match: g.match ?? null,
  }))),
]
const dup = ROWS.map((r) => r.key).filter((k, i, a) => a.indexOf(k) !== i)
if (dup.length) throw new Error('claves duplicadas en trabajo-config: ' + dup.join(', '))

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
    try {
      const h = await fetchMonthly(id)
      if (!h) return { id, status: 'missing' }
      if (/variaci[oó]n/i.test(h.units)) return { id, status: 'rejected', units: h.units }
      const map = {}
      for (const [k, v] of Object.entries(h.map)) map[qOf(k)] = v
      return { ...h, map, lastQ: qOf(h.last), status: ymIdx(h.last) < NOW - 24 ? 'stale' : 'ok' }
    } catch { return cache.raw?.[id] ? { ...cache.raw[id], status: 'cache' } : { id, status: 'error' } }
  }
  const raw = await pool(ROWS, 6, (r) => get(overrides[r.key] ?? r.id))

  let min = Infinity, max = -Infinity
  for (const h of raw) for (const k of Object.keys(h?.map ?? {})) { const i = qIdx(k); min = Math.min(min, i); max = Math.max(max, i) }
  const periods = Number.isFinite(min) ? Array.from({ length: max - min + 1 }, (_, i) => idxQ(min + i)) : []

  const series = ROWS.map((r, k) => {
    const h = raw[k]
    let orig = h?.map ? periods.map((p) => (p in h.map ? h.map[p] : null)) : null
    // tasas: si la API las publica como fracción (0,07) se pasan a puntos porcentuales (7,0)
    if (orig && r.type === 'rate') {
      const nums = orig.filter((v) => v != null)
      if (nums.length && Math.max(...nums.map(Math.abs)) <= 1.5) orig = orig.map((v) => (v == null ? null : +(v * 100).toFixed(6)))
    }
    const sa = orig ? adjustArrayQ(orig, periods) : null
    const gaps = orig ? gapsOf(orig, periods) : []
    // ¿la descripción de la API coincide con la etiqueta? (detecta IDs/etiquetas cruzados)
    const apiNorm = norm(h?.title)
    const labelWarn = r.match && h?.title && !r.match.some((m) => apiNorm.includes(m)) ? h.title : null
    log.push(`${(h?.status ?? 'missing').padEnd(8)} ${r.key.padEnd(26)} ${h?.id ?? r.id}${labelWarn ? `  ⚠ API dice: "${h.title}"` : ''}${gaps.length ? `  FALTAN:${gaps.length}` : ''}`)
    return {
      key: r.key, label: r.label, group: r.group, unit: r.unit, type: r.type, level: r.level, head: r.head, id: h?.id ?? r.id,
      status: h?.status ?? 'missing', title: h?.title ?? null, apiUnits: h?.units ?? null, last: h?.lastQ ?? null,
      saId: null, saKind: sa ? 'propia' : null, orig, sa, gaps, filled: [], apiNulls: h?.nulls?.length ?? 0, labelWarn,
    }
  })

  const ok = series.filter((x) => x.orig).length
  const meta = { fetchedAt: new Date().toISOString(), total: series.length, ok, start: periods[0] ?? null, end: periods.at(-1) ?? null, control: null }
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify({ meta, months: periods, series }))

  const fresh = {}
  for (const h of raw) if (h?.map && ['ok', 'stale'].includes(h.status)) fresh[h.id] = { id: h.id, map: h.map, last: h.last, lastQ: h.lastQ, title: h.title, units: h.units }
  if (Object.keys(fresh).length) { try { fs.writeFileSync(CACHE, JSON.stringify({ fetchedAt: meta.fetchedAt, raw: { ...cache.raw, ...fresh } })) } catch {} }

  console.log(`[econsur] Trabajo → ${path.relative(ROOT, OUT)} | ${ok}/${series.length} series | ${meta.start ?? '—'} a ${meta.end ?? '—'}`)
  const warn = series.filter((x) => x.labelWarn)
  if (warn.length) console.log(`[econsur] Trabajo ⚠ ${warn.length} series cuya descripción en la API no coincide con la etiqueta: ${warn.map((x) => `${x.key} (API: "${x.labelWarn}")`).join(' | ')}`)
  const stale = series.filter((x) => x.status === 'stale')
  if (stale.length) console.log(`[econsur] Trabajo: ${stale.length} series discontinuadas: ${stale.map((x) => x.key).join(', ')}`)
  const bad = series.filter((x) => !x.orig)
  if (bad.length) console.log(`[econsur] Trabajo sin datos (${bad.length}): ${bad.map((x) => x.key).join(', ')} (fijá el ID en data/series-overrides.json)`)
  if (process.env.SERIES_VERBOSE) console.log(log.join('\n'))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((e) => {
    console.warn('[econsur] no se pudo actualizar Trabajo:', e.message)
    if (!fs.existsSync(OUT)) {
      fs.mkdirSync(path.dirname(OUT), { recursive: true })
      fs.writeFileSync(OUT, JSON.stringify({ meta: { fetchedAt: null, ok: 0, total: ROWS.length }, months: [], series: [] }))
    }
  })
}
