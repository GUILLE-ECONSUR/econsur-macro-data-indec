import data from '../data/empleo.json'
import MonthlyTable from './MonthlyTable.jsx'

export default function Empleo({ query }) {
  return (
    <MonthlyTable query={query} data={data} name="Empleo y salarios" title="Empleo y Salarios" fileTag="empleo" noun="las ramas de actividad"
      defaultMode="yoy" levelUnit="puestos / millones de $ (según bloque)"
      levelDesc="Nivel de la serie original: puestos de trabajo (empleo) o millones de pesos corrientes (remuneración)."
      saLevelDesc="Nivel desestacionalizado: oficial en el empleo registrado del SIPA; estimación propia en Cuentas nacionales."
      saNote="La API publica la desestacionalizada oficial solo para el empleo registrado del SIPA (Secretaría de Trabajo). Para puestos de trabajo y remuneración de Cuentas nacionales (INDEC) se estima acá. La remuneración está en pesos corrientes: sus variaciones incluyen la inflación."
      lede="Empleo y salarios en frecuencia trimestral: empleo registrado privado (SIPA), puestos de trabajo totales y asalariados registrados, y remuneración al trabajo asalariado (Cuentas nacionales del INDEC). Fuente: API de Series de Tiempo (datos.gob.ar)." />
  )
}
