import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function normalizeBigInt(value: any): any {
  if (typeof value === "bigint") {
    return Number(value);
  }

  if (Array.isArray(value)) {
    return value.map(normalizeBigInt);
  }

  if (value && typeof value === "object") {
    const result: any = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = normalizeBigInt(v);
    }
    return result;
  }

  return value;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const anio = url.searchParams.get("anio");
    const mes = url.searchParams.get("mes");
    const ubicacion = url.searchParams.get("ubicacion");

    const condiciones: string[] = [];
    const condicionesPie: string[] = [];

    if (anio) {
      const cond = `YEAR(r.fechaIngreso) = '${anio}'`;
      condiciones.push(cond);
      condicionesPie.push(cond);
    }

    if (mes) {
      const cond = `MONTH(r.fechaIngreso) = '${mes}'`;
      condiciones.push(cond);
      condicionesPie.push(cond);
    }

    if (ubicacion) {
      const rack = ubicacion.match(/^\d+/)?.[0];
      const fila = ubicacion.match(/[A-Za-z]+$/)?.[0];

      if (rack && fila) {
        const cond = `u.rack = ${rack} AND u.fila = '${fila}'`;
        condiciones.push(cond);
        condicionesPie.push(cond);
      }
    }

    const whereClause = condiciones.length
      ? `WHERE ${condiciones.join(" AND ")}`
      : "";

    const whereClausePie = condicionesPie.length
      ? `WHERE ${condicionesPie.join(" AND ")}`
      : "";

    // 1. KPI
    const kpiData: any[] = await db.$queryRawUnsafe(`
      SELECT
        SUM(r.existenciaFisica) AS totalExistencias,
        SUM(CASE WHEN r.existenciaFisica = 0 THEN 1 ELSE 0 END) AS existenciasCero,
        SUM(CASE WHEN r.existenciaFisica BETWEEN 1 AND 5 THEN 1 ELSE 0 END) AS existenciasCriticas,
        COUNT(DISTINCT r.codigo) AS totalProductos
      FROM refacciones_l3 r
      INNER JOIN ubicacion u ON r.ubicacionId = u.id
      ${whereClause};
    `);

    // 2. Ubicaciones distintas
    const ubicacionesRows: any[] = await db.$queryRawUnsafe(`
      SELECT DISTINCT CONCAT(u.rack, u.fila) AS ubicacion
      FROM refacciones_l3 r
      INNER JOIN ubicacion u ON r.ubicacionId = u.id
      WHERE u.fila IS NOT NULL AND u.fila != ''
      ORDER BY ubicacion;
    `);

    // 3. Años y meses disponibles (para filtros dinámicos)
    const mesesAniosRows: any[] = await db.$queryRawUnsafe(`
      SELECT DISTINCT
        YEAR(r.fechaIngreso) AS anio,
        MONTH(r.fechaIngreso) AS mes
      FROM refacciones_l3 r
      INNER JOIN ubicacion u ON r.ubicacionId = u.id
      ${whereClause}
      ORDER BY anio, mes;
    `);

    const mesesDisponibles = Array.from(
      new Set(mesesAniosRows.map((row) => Number(row.mes)))
    ).sort((a, b) => a - b);

    const aniosDisponibles = Array.from(
      new Set(mesesAniosRows.map((row) => Number(row.anio)))
    ).sort((a, b) => a - b);

    // 4. Bar chart - top 10 productos
    const barChartData: any[] = await db.$queryRawUnsafe(`
      SELECT
        r.codigo,
        r.descripcion,
        r.existenciaFisica,
        CONCAT(u.rack, u.fila) AS ubicacion
      FROM refacciones_l3 r
      INNER JOIN ubicacion u ON r.ubicacionId = u.id
      ${whereClause}
      ORDER BY r.existenciaFisica DESC
      LIMIT 10;
    `);

    // 5. Line chart - evolución mensual
    const lineChartData: any[] = await db.$queryRawUnsafe(`
      WITH datos_mensuales AS (
        SELECT
          DATE_FORMAT(r.fechaIngreso, '%Y-%m') AS periodo,
          YEAR(r.fechaIngreso) AS anio,
          MONTH(r.fechaIngreso) AS mes,
          SUM(r.existenciaFisica) AS existencia_mes
        FROM refacciones_l3 r
        INNER JOIN ubicacion u ON r.ubicacionId = u.id
        ${whereClause}
        GROUP BY DATE_FORMAT(r.fechaIngreso, '%Y-%m'), YEAR(r.fechaIngreso), MONTH(r.fechaIngreso)
      )
      SELECT
        periodo,
        existencia_mes,
        SUM(existencia_mes) OVER (ORDER BY anio, mes) AS existencia_acumulada,
        COALESCE(LAG(existencia_mes, 1) OVER (ORDER BY anio, mes), 0) AS mes_anterior,
        (existencia_mes - COALESCE(LAG(existencia_mes, 1) OVER (ORDER BY anio, mes), 0)) AS diferencia,
        CASE 
          WHEN (existencia_mes - COALESCE(LAG(existencia_mes, 1) OVER (ORDER BY anio, mes), 0)) > 0 THEN 'subió'
          WHEN (existencia_mes - COALESCE(LAG(existencia_mes, 1) OVER (ORDER BY anio, mes), 0)) < 0 THEN 'bajó'
          ELSE 'igual'
        END AS tendencia
      FROM datos_mensuales
      ORDER BY anio, mes;
    `);

    // 6. Pie chart - existencias por ubicación
    const pieChartData: any[] = await db.$queryRawUnsafe(`
      SELECT
        CONCAT(u.rack, u.fila) AS ubicacion,
        SUM(r.existenciaFisica) AS totalExistencias
      FROM refacciones_l3 r
      INNER JOIN ubicacion u ON r.ubicacionId = u.id
      ${whereClausePie}
      GROUP BY CONCAT(u.rack, u.fila)
      ORDER BY totalExistencias DESC;
    `);

    // 7. Productos críticos
    const criticosData: any[] = await db.$queryRawUnsafe(`
      SELECT
        r.codigo,
        r.descripcion,
        r.existenciaFisica,
        CONCAT(u.rack, u.fila) AS ubicacion
      FROM refacciones_l3 r
      INNER JOIN ubicacion u ON r.ubicacionId = u.id
      WHERE r.existenciaFisica BETWEEN 0 AND 5
      ${anio || mes || ubicacion ? "AND " + condiciones.join(" AND ") : ""}
      ORDER BY r.existenciaFisica ASC
      LIMIT 20;
    `);

    const formattedData = {
      kpi: {
        totalExistencias: Number(kpiData[0]?.totalExistencias ?? 0),
        existenciasCero: Number(kpiData[0]?.existenciasCero ?? 0),
        existenciasCriticas: Number(kpiData[0]?.existenciasCriticas ?? 0),
        totalProductos: Number(kpiData[0]?.totalProductos ?? 0)
      },
      ubicaciones: ubicacionesRows.map((u) => u.ubicacion as string),
      mesesDisponibles,
      aniosDisponibles,
      charts: {
        barChart: {
          labels: barChartData.map((item) =>
            `${item.codigo} - ${item.descripcion}`.slice(0, 30) +
            (item.descripcion.length > 30 ? "..." : "")
          ),
          datasets: [
            {
              label: "Existencias",
              data: barChartData.map((item) =>
                Number(item.existenciaFisica ?? 0)
              ),
              backgroundColor: "rgba(54, 162, 235, 0.5)",
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 1
            }
          ]
        },
        lineChart: {
          labels: lineChartData.map((item) => item.periodo as string),
          datasets: [
            {
              label: "Existencias",
              data: lineChartData.map((item) => ({
                x: item.periodo as string,
                y: Number(item.existencia_acumulada ?? 0),
                existencia_mes: Number(item.existencia_mes ?? 0),
                diferencia: Number(item.diferencia ?? 0),
                tendencia: item.tendencia as string
              })),
              fill: false,
              backgroundColor: "rgba(75, 192, 192, 0.5)",
              borderColor: "rgba(75, 192, 192, 1)",
              tension: 0.1
            }
          ],
          metadata: lineChartData.map((item) => ({
            periodo: item.periodo as string,
            existencia_mes: Number(item.existencia_mes ?? 0),
            existencia_acumulada: Number(item.existencia_acumulada ?? 0),
            diferencia: Number(item.diferencia ?? 0),
            tendencia: item.tendencia as string
          }))
        },
        pieChart: {
          labels: pieChartData.map((item) => item.ubicacion as string),
          datasets: [
            {
              label: "Existencias por Ubicación",
              data: pieChartData.map((item) =>
                Number(item.totalExistencias ?? 0)
              ),
              backgroundColor: [
                "rgba(255, 99, 132, 0.7)",
                "rgba(54, 162, 235, 0.7)",
                "rgba(255, 206, 86, 0.7)",
                "rgba(75, 192, 192, 0.7)",
                "rgba(153, 102, 255, 0.7)",
                "rgba(255, 159, 64, 0.7)"
              ],
              borderColor: [
                "rgba(255, 99, 132, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 206, 86, 1)",
                "rgba(75, 192, 192, 1)",
                "rgba(153, 102, 255, 1)",
                "rgba(255, 159, 64, 1)"
              ],
              borderWidth: 1
            }
          ]
        }
      },
      topItems: {
        criticos: criticosData.map((item) => ({
          codigo: item.codigo,
          descripcion: item.descripcion,
          existenciaFisica: Number(item.existenciaFisica ?? 0),
          ubicacion: item.ubicacion as string
        }))
      }
    };

    const safeData = normalizeBigInt(formattedData);
    return NextResponse.json(safeData);
  } catch (error) {
    console.error("Error al obtener los datos del dashboard:", error);
    return NextResponse.json(
      {
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}
