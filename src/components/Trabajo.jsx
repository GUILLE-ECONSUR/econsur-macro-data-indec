import data from '../data/trabajo.json'
import MonthlyTable from './MonthlyTable.jsx'

export default function Trabajo({ query }) {
  return (
    <MonthlyTable query={query} data={data} name="Trabajo (EPH)" title="Trabajo" fileTag="trabajo" noun="las regiones y aglomerados"
      defaultMode="yoy" levelUnit="% / miles de personas"
      levelDesc="Nivel de la serie original: tasas en % y población en miles de personas."
      saLevelDesc="Nivel desestacionalizado (estimación propia): tasas en % y población en miles de personas."
      saNote="El INDEC no publica series desestacionalizadas de la EPH en la API: se estiman acá para todas las filas."
      extraNotes={[
        'En las tasas (desocupación, empleo, subocupación) las variaciones se expresan en puntos porcentuales (p.p.); en la población, en %.',
        'La EPH es una encuesta por muestra: en aglomerados chicos las tasas son volátiles y variaciones de pocos p.p. pueden no ser significativas, y la desestacionalización es poco confiable. Usar con cautela.',
        'Una fila con ⚠ indica que la descripción de esa serie en la API no coincide con su etiqueta (se detecta en cada build). Se muestra con el ID configurado: verificalo antes de usar el dato.',
      ]}
      lede="Mercado de trabajo de la EPH (INDEC) en frecuencia trimestral: población en niveles y tasas de desocupación, empleo y subocupación (total, demandante y no demandante) para el total de aglomerados, las seis regiones y cada aglomerado. Fuente: API de Series de Tiempo (datos.gob.ar)." />
  )
}
