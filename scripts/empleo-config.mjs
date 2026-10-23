// Empleo y salarios · frecuencia trimestral · API de Series de Tiempo.
//
// ORDEN: de lo agregado a lo desagregado. Cada bloque abre con los totales y sigue con las ramas de actividad en
// orden CIIU, que recorre la cadena productiva (primario → industria y energía → construcción → comercio y servicios).
// En el bloque SIPA cada rama trae su par oficial: serie con estacionalidad (155.1) y desestacionalizada (155.2).
//
// Fila: [etiqueta, id, nivel, esTotal, idDesestacionalizada?]   (nivel 0 = total/agregado, 1 = rama)

const L = (label, id, level = 1, head = false, saId) => [label, id, level, head, saId]

export const BLOCKS = [
  { id: 'sipa', group: 'Empleo registrado del sector privado (SIPA · Secretaría de Trabajo)', unit: 'puestos de trabajo', rows: [
    L('Total sector privado registrado', '155.1_TLTAL_C_0_0_5', 0, true, '155.2_TLTAL_S_0_0_5'),
    L('Agricultura, ganadería y pesca', '155.1_ACULTURSCA_C_0_0_27', 1, false, '155.2_ACULTURSCA_S_0_0_27'),
    L('Minería y petróleo', '155.1_MRIA_PELEO_C_0_0_16', 1, false, '155.2_MRIA_PELEO_S_0_0_16'),
    L('Industria', '155.1_ISTRIARIA_C_0_0_9', 1, false, '155.2_ISTRIARIA_S_0_0_9'),
    L('Electricidad, gas y agua', '155.1_ETRICIDGUA_C_0_0_21', 1, false, '155.2_ETRICIDGUA_S_0_0_21'),
    L('Construcción', '155.1_CTRUCCIION_C_0_0_12', 1, false, '155.2_CTRUCCIION_S_0_0_12'),
    L('Comercio', '155.1_CRCIOCIO_C_0_0_8', 1, false, '155.2_CRCIOCIO_S_0_0_8'),
    L('Servicios', '155.1_SICIOSIOS_C_0_0_9', 1, false, '155.2_SICIOSIOS_S_0_0_9'),
  ] },
  { id: 'puestos', group: 'Puestos de trabajo totales · Cuentas nacionales (INDEC)', unit: 'puestos de trabajo', rows: [
    L('Total general', '324.1_TOTAL_GENEAJO__29', 0, true),
    L('Total excluido sector público', '324.1_TOTAL_EXCLAJO__45', 0, true),
    L('Total sector público', '324.1_TOTAL_SECTAJO__36', 0, true),
    L('A · Agricultura, ganadería, caza y silvicultura', '324.1_A_AGRICULTAJO__49'),
    L('B · Pesca', '324.1_B_PESCA_PUAJO__23'),
    L('C · Explotación de minas y canteras', '324.1_C_EXPLOTACAJO__44'),
    L('D · Industria manufacturera', '324.1_D_INDUSTRIAJO__41'),
    L('E · Electricidad, gas y agua', '324.1_E_ELECT_GAAJO__32'),
    L('F · Construcción', '324.1_F_CONSTRUCAJO__30'),
    L('G · Comercio', '324.1_G_COMERCIOAJO__26'),
    L('H · Hoteles y restaurantes', '324.1_H_HOTELES_AJO__38'),
    L('I · Transporte, almacenamiento y comunicaciones', '324.1_I_TRANSPORAJO__58'),
    L('J · Intermediación financiera', '324.1_J_INTERMEDAJO__43'),
    L('K · Actividades inmobiliarias, empresariales y de alquiler', '324.1_K_ACT_INMOAJO__58'),
    L('M · Enseñanza', '324.1_M_ENSENIANZAJO__27'),
    L('N · Servicios sociales y de salud', '324.1_N_SERVICIOAJO__42'),
    L('O · Otras actividades de servicios comunitarias, sociales y personales', '324.1_O_OTRAS_ACAJO__60'),
    L('P · Hogares privados con servicio doméstico', '324.1_P_HOGARES_AJO__47'),
  ] },
  { id: 'asal', group: 'Puestos de trabajo asalariados registrados · Cuentas nacionales (INDEC)', unit: 'puestos de trabajo', rows: [
    L('Total general', '324.1_TOTAL_GENEADO__51', 0, true),
    L('Total sector público', '324.1_TOTAL_SECTADO__58', 0, true),
    L('B · Pesca', '324.1_B_PESCA_PUADO__45'),
    L('C · Explotación de minas y canteras', '324.1_C_EXPLOTACREG__59'),
    L('D · Industria manufacturera', '324.1_D_INDUSTRIREG__56'),
    L('F · Construcción', '324.1_F_CONSTRUCADO__52'),
    L('G · Comercio', '324.1_G_COMERCIOADO__48'),
    L('H · Hoteles y restaurantes', '324.1_H_HOTELES_ADO__60'),
    L('I · Transporte, almacenamiento y comunicaciones', '324.1_I_TRANSPORREG__58'),
    L('J · Intermediación financiera', '324.1_J_INTERMEDADO__65'),
    L('K · Actividades inmobiliarias, empresariales y de alquiler', '324.1_K_ACT_INMOADO__57'),
    L('M · Enseñanza', '324.1_M_ENSENIANZADO__49'),
    L('O · Otras actividades de servicios comunitarias, sociales y personales', '324.1_O_OTRAS_ACREG__51'),
    L('P · Hogares privados con servicio doméstico', '324.1_P_HOGARES_REG__56'),
  ] },
  { id: 'rem', group: 'Remuneración al trabajo asalariado · Cuentas nacionales (INDEC)', unit: 'millones de $ corrientes', rows: [
    L('Total general', '323.1_TOTAL_GENEADO__45', 0, true),
    L('Total excluido sector público', '323.1_TOTAL_EXCLADO__52', 0, true),
    L('Total sector público', '323.1_TOTAL_SECTADO__52', 0, true),
    L('Sin distribuir', '323.1_SIN_DISTRIADO__46', 0, false),
    L('A · Agricultura, ganadería, caza y silvicultura', '323.1_A_AGRICULTADO__50'),
    L('B · Pesca', '323.1_B_PESCA_READO__39'),
    L('C · Explotación de minas y canteras', '323.1_C_EXPLOTACADO__60'),
    L('D · Industria manufacturera', '323.1_D_INDUSTRIADO__57'),
    L('E · Electricidad, gas y agua', '323.1_E_ELECTRICADO__55'),
    L('F · Construcción', '323.1_F_CONSTRUCADO__46'),
    L('G · Comercio', '323.1_G_COMERCIOADO__42'),
    L('H · Hoteles y restaurantes', '323.1_H_HOTELES_ADO__54'),
    L('I · Transporte, almacenamiento y comunicaciones', '323.1_I_TRANSPORADO__74'),
    L('J · Intermediación financiera', '323.1_J_INTERMEDADO__59'),
    L('K · Actividades inmobiliarias, empresariales y de alquiler', '323.1_K_ACT_INMOADO__74'),
    L('L · Administración pública, defensa y seguridad social', '323.1_L_ADM_PUBLADO__76'),
    L('M · Enseñanza', '323.1_M_ENSENIANADO__44'),
    L('N · Servicios sociales y de salud', '323.1_N_SERVICIOADO__58'),
    L('O · Otras actividades de servicios comunitarias, sociales y personales', '323.1_O_OTRAS_ACADO__58'),
    L('P · Hogares privados con servicio doméstico', '323.1_P_HOGARES_ADO__73'),
  ] },
]
