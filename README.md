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
