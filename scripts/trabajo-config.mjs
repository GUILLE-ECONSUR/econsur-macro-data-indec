// Trabajo (EPH, INDEC) · frecuencia trimestral · API de Series de Tiempo.
//
// ORDEN: primero la oferta y demanda de trabajo en niveles (población total → activa → ocupada → desocupada →
// subocupada), luego las tasas (desocupación, empleo, subocupación total / demandante / no demandante).
// Cada tasa sigue el mismo árbol geográfico: total de aglomerados → región (GBA, Pampeana, Cuyo, Noroeste, Nordeste,
// Patagonia) y, debajo de cada región, sus aglomerados.
//
// match: fragmentos (sin tildes, en minúscula) que debe contener la descripción de la API para esa fila; si no los
// contiene, la fila se marca con ⚠ ("la descripción de la API no coincide con la etiqueta").
//
// No se incluyen las series 42.x (EPH puntual 1974-2003): están discontinuadas y son semestrales.

export const GEO = [
  { k: 'total', label: 'Total aglomerados urbanos', level: 0, head: true },
  { k: 'gba', label: 'Región GBA (Gran Buenos Aires)', level: 0, head: true, match: ['gran buenos aires'] },
  { k: 'caba', label: 'CABA', level: 1, match: ['caba'] },
  { k: 'pgba', label: 'Partidos del GBA', level: 1, match: ['partidos'] },
  { k: 'pampeana', label: 'Región Pampeana', level: 0, head: true, match: ['pampeana'] },
  { k: 'glp', label: 'Gran La Plata', level: 1, match: ['la plata'] },
  { k: 'bb', label: 'Bahía Blanca–Cerri', level: 1, match: ['bahia blanca'] },
  { k: 'mdp', label: 'Mar del Plata', level: 1, match: ['mar del plata'] },
  { k: 'sn', label: 'San Nicolás–Villa Constitución', level: 1, match: ['san nicolas'] },
  { k: 'gro', label: 'Gran Rosario', level: 1, match: ['rosario'] },
  { k: 'gsf', label: 'Gran Santa Fe', level: 1, match: ['santa fe'] },
  { k: 'gpa', label: 'Gran Paraná', level: 1, match: ['parana'] },
  { k: 'conc', label: 'Concordia', level: 1, match: ['concordia'] },
  { k: 'gco', label: 'Gran Córdoba', level: 1, match: ['cordoba'] },
  { k: 'rc', label: 'Río Cuarto', level: 1, match: ['rio cuarto'] },
  { k: 'sr', label: 'Santa Rosa–Toay', level: 1, match: ['santa rosa'] },
  { k: 'cuyo', label: 'Región Cuyo', level: 0, head: true, match: ['cuyo'] },
  { k: 'gm', label: 'Gran Mendoza', level: 1, match: ['mendoza'] },
  { k: 'gsj', label: 'Gran San Juan', level: 1, match: ['san juan'] },
  { k: 'sl', label: 'San Luis–El Chorrillo', level: 1, match: ['san luis'] },
  { k: 'noroeste', label: 'Región Noroeste', level: 0, head: true, match: ['noroeste'] },
  { k: 'gt', label: 'Gran Tucumán–Tafí Viejo', level: 1, match: ['tucuman'] },
  { k: 'salta', label: 'Salta', level: 1, match: ['salta'] },
  { k: 'jujuy', label: 'Jujuy–Palpalá', level: 1, match: ['jujuy'] },
  { k: 'sde', label: 'Santiago del Estero–La Banda', level: 1, match: ['santiago del estero'] },
  { k: 'gca', label: 'Gran Catamarca', level: 1, match: ['catamarca'] },
  { k: 'lr', label: 'La Rioja', level: 1, match: ['la rioja'] },
  { k: 'nordeste', label: 'Región Nordeste', level: 0, head: true, match: ['nordeste'] },
  { k: 'gre', label: 'Gran Resistencia', level: 1, match: ['resistencia'] },
  { k: 'corr', label: 'Corrientes', level: 1, match: ['corrientes'] },
  { k: 'form', label: 'Formosa', level: 1, match: ['formosa'] },
  { k: 'pos', label: 'Posadas', level: 1, match: ['posadas'] },
  { k: 'patagonia', label: 'Región Patagonia', level: 0, head: true, match: ['patagonia'] },
  { k: 'neu', label: 'Neuquén–Plottier', level: 1, match: ['neuquen'] },
  { k: 'cr', label: 'Comodoro Rivadavia–Rada Tilly', level: 1, match: ['comodoro'] },
  { k: 'rg', label: 'Río Gallegos', level: 1, match: ['rio gallegos'] },
  { k: 'urg', label: 'Ushuaia–Río Grande', level: 1, match: ['ushuaia'] },
  { k: 'rt', label: 'Rawson–Trelew', level: 1, match: ['rawson'] },
  { k: 'vcp', label: 'Viedma–Carmen de Patagones', level: 1, match: ['viedma'] },
]

// Población en miles de personas · total de aglomerados (EPH)
export const POBLACION = [
  ['Población total', '49.2_TAEP_0_0_37', 0, true],
  ['Población económicamente activa', '49.2_TAEP_0_0_25', 0, true],
  ['Población ocupada', '49.2_TAEO_0_0_30', 1],
  ['Población desocupada', '49.2_TAED_0_0_33', 1],
  ['Población subocupada', '49.2_TOTAL_AGLODOS_0_T_33_90', 1],
  ['Subocupada demandante', '49.2_TOTAL_AGLOTES_0_T_45_1', 1],
  ['Subocupada no demandante', '49.2_TOTAL_AGLOTES_0_T_48_13', 1],
]

// Tasas (%) por geografía
export const MEASURES = [
  { id: 'desocupacion', group: 'Tasa de desocupación', ids: {
    total: '45.2_ECTDT_0_T_33',
    gba: '45.2_ECTDTG_0_T_37', caba: '45.2_ECTDTC_0_T_38', pgba: '45.2_ECTDTPG_0_T_46',
    pampeana: '45.2_ECTDTRP_0_T_49', glp: '45.2_ECTDTGLP_0_T_47', bb: '45.2_ECTDTBB_0_T_46', mdp: '45.2_ECTDTMDP_0_T_47', sn: '45.2_ECTDTSN_0_T_45',
    gro: '45.2_ECTDTGR_0_T_46', gsf: '45.2_ECTDTGSF_0_T_47', gpa: '45.2_ECTDTGP_0_T_45', conc: '45.2_ECTDTC_0_T_43', gco: '45.2_ECTDTGC_0_T_46',
    rc: '45.2_ECTDTRC_0_T_44', sr: '45.2_ECTDTSR_0_T_44',
    cuyo: '45.2_ECTDTCU_0_T_38', gm: '45.2_ECTDTGM_0_T_46', gsj: '45.2_ECTDTGSJ_0_T_47', sl: '45.2_ECTDTSL_0_T_42',
    noroeste: '45.2_ECTDTNO_0_T_42', gt: '45.2_ECTDTGT_0_T_46', salta: '45.2_ECTDTS_0_T_39', jujuy: '45.2_ECTDTJ_0_T_39', sde: '45.2_ECTDTSDE_0_T_53',
    gca: '45.2_ECTDTGC_0_T_48', lr: '45.2_ECTDTLR_0_T_42',
    nordeste: '45.2_ECTDTNE_0_T_42', gre: '45.2_ECTDTGR_0_T_50', corr: '45.2_ECTDTC_0_T_44', form: '45.2_ECTDTF_0_T_41', pos: '45.2_ECTDTP_0_T_41',
    patagonia: '45.2_ECTDTP_0_T_43', neu: '45.2_ECTDTN_0_T_41', cr: '45.2_ECTDTCR_0_T_52', rg: '45.2_ECTDTRG_0_T_46', urg: '45.2_ECTDTURG_0_T_52',
    rt: '45.2_ECTDTRT_0_T_47', vcp: '45.2_ECTDTVCP_0_T_57',
  } },
  { id: 'empleo', group: 'Tasa de empleo', ids: {
    total: '44.2_ECTET_0_T_30',
    gba: '44.2_ECTETG_0_T_34', caba: '44.2_ECTETC_0_T_35', pgba: '44.2_ECTETPG_0_T_43',
    pampeana: '44.2_ECTETRP_0_T_46', glp: '44.2_ECTETGLP_0_T_44', bb: '44.2_ECTETBB_0_T_43', mdp: '44.2_ECTETMDP_0_T_44', sn: '44.2_ECTETSN_0_T_42',
    gro: '44.2_ECTETGR_0_T_43', gsf: '44.2_ECTETGSF_0_T_44', gpa: '44.2_ECTETGP_0_T_42', conc: '44.2_ECTETC_0_T_40', gco: '44.2_ECTETGC_0_T_43',
    rc: '44.2_ECTETRC_0_T_41', sr: '44.2_ECTETSR_0_T_41',
    cuyo: '44.2_ECTETCU_0_T_35', gm: '44.2_ECTETGM_0_T_43', gsj: '44.2_ECTETGSJ_0_T_44', sl: '44.2_ECTETSL_0_T_39',
    // OJO: en el listado recibido las descripciones de NO y NE figuran cruzadas; se respeta el código del ID (NO = noroeste, NE = nordeste)
    noroeste: '44.2_ECTETNO_0_T_39', gt: '44.2_ECTETGT_0_T_43', salta: '44.2_ECTETS_0_T_36', jujuy: '44.2_ECTETJ_0_T_36', sde: '44.2_ECTETSDE_0_T_50',
    gca: '44.2_ECTETGC_0_T_45', lr: '44.2_ECTETLR_0_T_39',
    nordeste: '44.2_ECTETNE_0_T_39', gre: '44.2_ECTETGR_0_T_47', corr: '44.2_ECTETC_0_T_41', form: '44.2_ECTETF_0_T_38',
    patagonia: '44.2_ECTETP_0_T_40', neu: '44.2_ECTETN_0_T_38', cr: '44.2_ECTETCR_0_T_49', rg: '44.2_ECTETRG_0_T_43', urg: '44.2_ECTETURG_0_T_49',
    rt: '44.2_ECTETRT_0_T_44', vcp: '44.2_ECTETVCP_0_T_54',
  } },
  { id: 'subocupacion', group: 'Tasa de subocupación (total)', ids: {
    total: '46.2_ECTST_0_T_36',
    caba: '46.2_ECTSTC_0_T_41',
    pampeana: '46.2_ECTSTRP_0_T_52', bb: '46.2_ECTSTBB_0_T_49', conc: '46.2_ECTSTC_0_T_46', gco: '46.2_ECTSTGC_0_T_49', sr: '46.2_ECTSTSR_0_T_47',
    cuyo: '46.2_ECTSTCU_0_T_41', gsj: '46.2_ECTSTGSJ_0_T_50',
    noroeste: '46.2_ECTSTNO_0_T_45', salta: '46.2_ECTSTS_0_T_42', jujuy: '46.2_ECTSTJ_0_T_42', lr: '46.2_ECTSTLR_0_T_45',
    nordeste: '46.2_ECTSTNE_0_T_45', corr: '46.2_ECTSTC_0_T_47', form: '46.2_ECTSTF_0_T_44', pos: '46.2_ECTSTP_0_T_44',
    patagonia: '46.2_ECTSTP_0_T_46', neu: '46.2_ECTSTN_0_T_44', cr: '46.2_ECTSTCR_0_T_55', urg: '46.2_ECTSTURG_0_T_55',
  } },
  { id: 'subdem', group: 'Tasa de subocupación demandante', ids: {
    total: '47.2_ECTSDT_0_T_47',
    caba: '47.2_ECTSDTC_0_T_52', pgba: '47.2_ECTSDTPG_0_T_60',
    bb: '47.2_ECTSDTBB_0_T_60', conc: '47.2_ECTSDTC_0_T_57', gro: '47.2_ECTSDTGR_0_T_60', rc: '47.2_ECTSDTRC_0_T_58', sr: '47.2_ECTSDTSR_0_T_58',
    cuyo: '47.2_ECTSDTCU_0_T_52', gm: '47.2_ECTSDTGM_0_T_60', sl: '47.2_ECTSDTSL_0_T_56',
    noroeste: '47.2_ECTSDTNO_0_T_56', gt: '47.2_ECTSDTGT_0_T_60', salta: '47.2_ECTSDTS_0_T_53', lr: '47.2_ECTSDTLR_0_T_56',
    nordeste: '47.2_ECTSDTNE_0_T_56', gre: '47.2_ECTSDTGR_0_T_53', form: '47.2_ECTSDTF_0_T_55', pos: '47.2_ECTSDTP_0_T_55',
    patagonia: '47.2_ECTSDTP_0_T_57', rg: '47.2_ECTSDTRG_0_T_60', rt: '47.2_ECTSDTRT_0_T_50',
  } },
  { id: 'subnodem', group: 'Tasa de subocupación no demandante', ids: {
    patagonia: '48.2_ECTSNDTP_0_T_60', neu: '48.2_ECTSNDTN_0_T_58', corr: '48.2_ECTSNDTC_0_T_50', form: '48.2_ECTSNDTF_0_T_58', pos: '48.2_ECTSNDTP_0_T_58',
  } },
]
