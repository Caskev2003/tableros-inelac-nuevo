import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const filtro = url.searchParams.get("filtro");

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    const datosKPI: any[] = await db.$queryRawUnsafe(`
      SELECT
        SUM(existenciaFisica) AS totalExistencias,
        AVG(existenciaFisica) AS promedioExistencias,
        SUM(CASE WHEN existenciaFisica = 0 THEN 1 ELSE 0 END) AS existenciasCero,
        SUM(CASE WHEN existenciaFisica BETWEEN 1 AND 5 THEN 1 ELSE 0 END) AS existenciasCriticas,
        COUNT(CASE WHEN existenciaFisica < 10 THEN 1 ELSE NULL END) AS existenciasBajo10,
        SUM(retenidos) AS retenidos
      FROM quimicos;
    `);

    const {
      totalExistencias,
      promedioExistencias,
      existenciasCero,
      existenciasCriticas,
      existenciasBajo10,
      retenidos
    } = datosKPI[0] ?? {};

    const resultKPI = {
      totalExistencias: Number(totalExistencias) ?? 0,
      promedio: Number(promedioExistencias) ?? 0,
      existenciasCero: Number(existenciasCero) ?? 0,
      existenciasCriticas: Number(existenciasCriticas) ?? 0,
      existenciasBajo10: Number(existenciasBajo10) ?? 0,
      retenidos: Number(retenidos) ?? 0
    };

    let condicion = `WHERE DATE_FORMAT(fechaIngreso, '%Y-%m') < '${currentMonth}'`;

    if (filtro) {
      if (/^\d{4}$/.test(filtro)) {
        condicion = `WHERE YEAR(fechaIngreso) = ${filtro}`;
      } else if (/^\d{4}-\d{2}$/.test(filtro)) {
        condicion = `WHERE DATE_FORMAT(fechaIngreso, '%Y-%m') = '${filtro}'`;
      } else if (/^\d{2}$/.test(filtro)) {
        condicion = `WHERE DATE_FORMAT(fechaIngreso, '%m') = '${filtro}'`;
      } else {
        condicion = `WHERE codigo = '${filtro}' OR noLote = '${filtro}'`;
      }
    }

    const datosHistoricos: any[] = await db.$queryRawUnsafe(`
      SELECT
        DATE_FORMAT(fechaIngreso, '%Y-%m') AS mes,
        SUM(existenciaFisica) AS totalMes,
        MAX(codigo) AS codigo,
        MAX(descripcion) AS descripcion,
        MAX(noLote) AS noLote
      FROM quimicos
      ${condicion}
      GROUP BY mes
      ORDER BY mes;
    `);

    const etiquetas: string[] = [];
    const valoresAcumulados: number[] = [];
    const valoresPorMes: number[] = [];
    const meta = [];
    let acumulado = 0;

    for (const fila of datosHistoricos) {
      const totalMes = Number(fila.totalMes);
      acumulado += totalMes;
      etiquetas.push(fila.mes);
      valoresAcumulados.push(acumulado);
      valoresPorMes.push(totalMes);
      meta.push({
        existencia: totalMes,
        codigo: fila.codigo,
        descripcion: fila.descripcion,
        noLote: fila.noLote
      });
    }

    if (!filtro) {
      const valorMesActual = Number(totalExistencias) - acumulado;
      etiquetas.push(currentMonth);
      valoresPorMes.push(valorMesActual);
      valoresAcumulados.push(Number(totalExistencias));
      meta.push({ 
        existencia: valorMesActual, 
        codigo: 'TOTAL', 
        descripcion: 'Total acumulado',
        noLote: 'N/A'
      });
    }

    const chartDataset = {
      labels: etiquetas,
      datasets: [
        {
          label: "Existencias Totales Acumuladas",
          data: valoresAcumulados,
          meta,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
          fill: false
        }
      ]
    };

    return NextResponse.json({
      kpi: resultKPI,
      barChart: chartDataset,
      lineChart: chartDataset
    });
  } catch (error) {
    console.error("Error al obtener los datos", error);
    return NextResponse.json({
      mensaje: "Error al obtener datos",
      error: (error as Error).message
    });
  }
}