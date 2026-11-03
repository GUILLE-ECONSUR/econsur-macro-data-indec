# EconSur Macro

Tablero web con los **Principales indicadores del INDEC**. Lee el Excel del INDEC y muestra
la hoja principal (variables destacadas + tablas por frecuencia) y una pestaña por cada hoja
del archivo (Cuentas nacionales, Comercio, Sectores, Precios y canastas, Empleo y condiciones
de vida, Sector externo, Turismo y servicios, Fuentes), con el mismo orden y bloques del Excel.

## Cómo funciona

```
data/indicadores.xlsx ──► scripts/build-data.mjs ──► src/data/indec.json ──► Vite + React ──► dist/
        (único dato que se sube)       (se ejecuta en cada build)
```

- No hay base de datos ni servidor: el Excel se convierte a JSON **durante el build**.
- El parser es genérico: detecta cada bloque por las filas "Unidad de medida", así que
  sigue funcionando cuando el INDEC agrega meses o trimestres nuevos.
- Haciendo clic en cualquier fila (o tarjeta) se abre un panel con gráficos.

## Series trimestrales (API de datos.gob.ar)

La solapa **Series trimestrales** muestra el histórico de las principales variables en frecuencia
trimestral, en tres modalidades (serie original, variación trimestral y variación trimestral
interanual) y con selector de trimestres (desde / hasta y rangos rápidos). Se puede descargar el
recorte en CSV y, al hacer clic en una fila, ver el gráfico y los datos de la serie.

```
API Series de Tiempo ──► scripts/build-series.mjs ──► src/data/series.json
 (apis.datos.gob.ar)       (se ejecuta en cada build)
```

- La solapa **Balance cambiario** usa el mismo cuadro con las series del dataset 182.1 (BCRA): cuenta
  corriente cambiaria y cuenta capital y financiera cambiaria. Son flujos mensuales en millones de US$,
  sumados por trimestre; las variaciones se muestran como diferencia absoluta. Se definen en
  `scripts/series-config.mjs` con `tab: 'balance'` (y `indent` para el sangrado).
- La solapa **EMAE** (`scripts/build-emae.mjs`) muestra el nivel general, la tendencia-ciclo y los 16
  sectores en 9 modalidades (nivel original y desest., mensual, trimestral, mensual i.a., trimestral i.a.,
  YTD, YTD i.a. y mensual desest.), con desde/hasta, CSV y gráfico por serie. La API no publica sectoriales
  desestacionalizadas: para el nivel general se usa la oficial del INDEC y los sectores se desestacionalizan
  en el build (descomposición clásica multiplicativa). Es una estimación, no el X-13 del INDEC; el build
  imprime un control contra la oficial del nivel general. Los IDs se pueden fijar en
  `data/series-overrides.json` (claves `total`, `tc`, `A`…`O`, `IN`; con sufijo `_sa` para la desest.).
- La solapa **IPI manufacturero** (`scripts/build-ipi.mjs` + `scripts/ipi-config.mjs`) tiene la misma estructura
  que EMAE con el nivel general y 84 divisiones y subclases del IPI, **ordenadas por cadena productiva**:
  agroindustria → textiles y cuero → madera y papel → refinación → química, caucho y plástico → minerales no
  metálicos (construcción) → metales básicos → maquinaria y equipos (bienes de capital) → automotriz y transporte
  → muebles y otras. Cada bloque muestra primero la división (negrita) y debajo sus subclases. Para reordenar o
  corregir la jerarquía basta con editar `ipi-config.mjs`; para fijar un ID, usar `data/series-overrides.json`
  con la clave de la serie (`SERIES_VERBOSE=1 npm run ipi` las imprime). Las desestacionalizadas de divisiones y
  subclases son estimación propia (la oficial solo existe para el nivel general).
- La solapa **Empleo y Salarios** (`scripts/build-empleo.mjs` + `scripts/empleo-config.mjs`) usa el mismo
  componente en **frecuencia trimestral**, con las modalidades Nivel original, Nivel desest., Trimestral,
  Anual (i.a.), YTD, YTD i.a. y Trimestral desest. Incluye: empleo registrado privado del SIPA (serie con
  estacionalidad + desestacionalizada **oficial** de la Secretaría de Trabajo), puestos de trabajo totales y
  asalariados registrados, y remuneración al trabajo asalariado de Cuentas nacionales (INDEC, $ corrientes).
  Para las series de Cuentas nacionales la desestacionalizada es una estimación propia (media móvil 2x4);
  el build la contrasta con la oficial del SIPA total. Los bloques abren con los totales y siguen las ramas
  en orden CIIU (de lo primario a los servicios).
- La solapa **Trabajo** (`scripts/build-trabajo.mjs` + `scripts/trabajo-config.mjs`) muestra la EPH en
  frecuencia trimestral: población en niveles (total → activa → ocupada → desocupada → subocupada) y tasas de
  desocupación, empleo y subocupación (total, demandante, no demandante) con el árbol total aglomerados →
  región → aglomerado. Las variaciones de tasas son en **puntos porcentuales**; las de población, en %. La
  desestacionalizada es estimación propia (la API no publica una oficial). En cada build se compara la
  descripción de la API con la etiqueta de cada fila y se marca con ⚠ lo que no coincide. Se excluyen las
  series `42.x` (EPH puntual 1974-2003, discontinuadas y semestrales).
- **Meses faltantes en el EMAE:** si la API publica un mes vacío, la tabla lo muestra como “—” (con trama),
  avisa cuántos meses faltan en el período y lista las series afectadas en “Calidad de datos”. Para el nivel
  general y la tendencia-ciclo, el build reconstruye esos meses con las series oficiales de variación
  (`143.3_ICE_SERVIA_2004_A_25` interanual, `143.3_ICE_SER_VM_2004_A_34` y `…_31` mensuales) y los marca en cursiva.
  `SERIES_VERBOSE=1 npm run emae` imprime por serie `API-null` (filas vacías en la API), `reconstruidos` y `FALTAN`.
- El catálogo está en `scripts/series-config.mjs`: por cada variable define frecuencia, agregación a
  trimestre (promedio / suma / fin de período) y tipo de variación (% / p.p. / diferencia).
- Cada serie se resuelve por: `data/series-overrides.json` → IDs conocidos → búsqueda por texto.
- Las series mensuales se agregan solo con trimestres completos (3 meses).
- Si la API no responde, el build usa `data/series-cache.json` (última descarga buena, si la commiteás)
  y nunca se cae.
- **Revisá la primera vez** qué serie se resolvió para cada variable: `SERIES_VERBOSE=1 npm run series`
  imprime el ID usado. Para fijar o corregir una:
  ```bash
  npm run series:find -- "canasta básica total"      # lista IDs candidatos
  # luego, en data/series-overrides.json:  { "cbt": "ID_ELEGIDO" }
  ```
- Protecciones al resolver cada serie: se **rechaza** una serie idx cuyas unidades sean "variación
  porcentual" (no sirve para recalcular variaciones) y se **marca como discontinuada** la que lleva más
  de 2 años sin datos. En el panel de cada serie se ve su estado (elegida por búsqueda, discontinuada,
  tomada de caché). Las series diarias (p. ej. línea de pobreza) se reducen a mes y luego a trimestre.
- Para refrescar el histórico sin subir un Excel, `.github/workflows/refresh.yml` pide un deploy
  semanal a Vercel (crear un *Deploy Hook* y guardarlo como secreto `VERCEL_DEPLOY_HOOK`).

## Gráficos de “Últimos períodos”

Al abrir un indicador, el gráfico de “Últimos períodos” suma una barra dorada con el **último dato disponible**,
tomado de la misma medida que la serie (por ejemplo, la variación mensual s.e. o la interanual). Si solo existe
una medida distinta del mismo tipo, la barra va atenuada y se avisa; si la unidad no es comparable (p. ej. un nivel
junto a variaciones), el dato se informa debajo del gráfico sin barra.

## Exportar datos

El botón **⬇ Exportar CSV** del encabezado descarga **todos** los datos de la solapa activa (separador `;`, decimal con
coma y UTF-8 con BOM, para abrir directo en Excel en español):

- Principales indicadores y hojas del Excel: formato largo, una fila por celda (hoja, sección, indicador, unidad, bloque, columna, valor).
- Series trimestrales, Balance cambiario, EMAE, IPI, Empleo y Salarios y Trabajo: una fila por serie y modalidad, con todos los períodos como columnas.
- Fuentes: grupo, nombre y URL.

En las hojas de detalle (Cuentas nacionales a Turismo y servicios) cada **tabla** tiene además su propio botón **⬇ Exportar CSV**, que descarga solo esa tabla.

Las solapas con selector de período además tienen **Descargar vista (CSV)**, que exporta solo la modalidad y el rango elegidos.

## Actualizar los datos

1. Descargá el Excel nuevo del INDEC.
2. Reemplazá `data/indicadores.xlsx` (mismo nombre).
3. `git add data/indicadores.xlsx && git commit -m "Datos INDEC <mes>" && git push`

Vercel detecta el push, ejecuta `npm run build` y publica la versión nueva sola.
(También se puede hacer desde la web de GitHub: *Add file → Upload files* sobre `data/`.)

## Desarrollo local

```bash
npm install
npm run dev      # genera el JSON y levanta http://localhost:5173
npm run build    # build de producción en /dist
```

Requiere Node 18 o superior.

## Deploy en Vercel

1. Subí este repo a GitHub.
2. En vercel.com: **Add New → Project** e importá el repo.
3. Vercel detecta Vite solo (el `vercel.json` ya fija `npm run build` y `dist`). Click en **Deploy**.

## Estructura

| Ruta | Qué hace |
|---|---|
| `data/indicadores.xlsx` | Excel fuente (lo único que se actualiza) |
| `scripts/build-data.mjs` | Parser Excel → JSON |
| `scripts/series-config.mjs` | Catálogo de series históricas (IDs, agregación, tipo) |
| `scripts/build-trabajo.mjs`, `trabajo-config.mjs` | Trabajo (EPH) trimestral por región y aglomerado |
| `scripts/build-empleo.mjs`, `empleo-config.mjs` | Empleo y salarios trimestral (SIPA + Cuentas nacionales) |
| `scripts/build-ipi.mjs`, `ipi-config.mjs` | IPI manufacturero por división/subclase (orden productivo) |
| `scripts/build-emae.mjs` | EMAE mensual por sector + desestacionalización |
| `scripts/build-series.mjs` | Descarga y trimestraliza series de datos.gob.ar |
| `data/series-overrides.json` | IDs fijados a mano (opcional) |
| `src/App.jsx` | Pestañas, página principal y hojas |
| `src/components/` | Tabla de bloques, tarjetas destacadas, panel de gráficos |
| `.github/workflows/build.yml` | Verifica que el Excel nuevo compile antes del deploy |

## Indicadores destacados

Las tarjetas de la portada se buscan **por nombre** en `src/components/KpiStrip.jsx` (lista `PICKS`).
Para cambiar cuáles se muestran, editá esa lista.

## Calidad de datos

El build informa cuántas celdas del Excel traen error (`#REF!`, `#N/A`) o texto en lugar de número.
Esas celdas se muestran como “—” y la app lo avisa en el pie de página. Son errores del archivo de
origen, no de la app.
