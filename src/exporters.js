import { downloadCSV, stamp, val } from './csv.js'

const BLOQUE = { ref: 'Referencia', recent: 'Últimos períodos', latest: 'Último dato', change: 'Variación', extra: 'Otros' }

// Hojas que vienen del Excel (principal + detalle): formato "largo", una fila por celda del cuadro.
export function exportSheet(t) {
  const rows = [['Hoja', 'Sección', 'Frecuencia', 'Subsección', 'Indicador', 'Unidad / medida', 'Bloque', 'Columna', 'Período del último dato', 'Valor', 'Observación', 'Fecha último dato (Excel)']]
  for (const b of t.blocks) {
    let sub = '', parent = ''
    for (const r of b.rows) {
      if (r.t === 'h') { sub = r.text; continue }
      if (!r.cont) parent = r.label
      for (const g of b.groups) {
        r.v[g.name].forEach((c, j) => {
          const col = g.cols[j]
          const period = g.name === 'latest' ? (g.period || (g.unitHeader ? col.label : '')) : ''
          const obs = c.e ? (c.e === '-' ? 'Sin dato' : `Sin dato en el Excel de origen (${c.e})`) : ''
          rows.push([t.name, b.title, b.freq ?? '', sub, parent, r.u[g.name] || '', BLOQUE[g.name] ?? g.name, col.label, period, val(c), obs, r.last ?? ''])
        })
      }
    }
  }
  downloadCSV(`econsur-${t.id}-${stamp()}.csv`, rows)
}

export function exportSources(sources) {
  const rows = [['Grupo', 'Fuente', 'URL']]
  for (const g of sources) for (const i of g.items) rows.push([g.group, i.label, i.url])
  downloadCSV(`econsur-fuentes-${stamp()}.csv`, rows)
}
