import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const anio = url.searchParams.get("anio");
    const mes = url.searchParams.get("mes");
    const ubicacion = url.searchParams.get("ubicacion");

    let condiciones: string[] = [];
    let condicionesPie: string[] = [];
    
    if (anio) {
      const cond = `YEAR(r.fechaIngreso) = '20${anio}'`;
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
    
    const whereClause = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const whereClausePie = condicionesPie.length ? `WHERE ${condicionesPie.join(' AND ')}` : '';

    // 1. KPI - Datos generales
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

    // 2. Ubicaciones disponibles
    const ubicaciones: any[] = await db.$queryRawUnsafe(`
      SELECT DISTINCT CONCAT(u.rack, u.fila) AS ubicacion
      FROM refacciones_l3 r
      INNER JOIN ubicacion u ON r.ubicacionId = u.id
      WHERE u.fila IS NOT NULL AND u.fila != ''
      ORDER BY ubicacion;
    `);

    // 3. Gráfico de barras - Top 10 productos con más existencia
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

    // 4. Gráfico de líneas - Evolución histórica de existencias con tendencia
    const lineChartData: any[] = await db.$queryRawUnsafe(`
      WITH datos_mensuales AS (
        SELECT
          DATE_FORMAT(r.fechaIngreso, '%Y-%m') AS periodo,
          SUM(r.existenciaFisica) AS existencia_mes
        FROM refacciones_l3 r
        INNER JOIN ubicacion u ON r.ubicacionId = u.id
        ${whereClause}
        GROUP BY periodo
        ORDER BY periodo
      )
      SELECT
        periodo,
        existencia_mes,
        SUM(existencia_mes) OVER (ORDER BY periodo) AS existencia_acumulada,
        (existencia_mes - LAG(existencia_mes, 1, 0) OVER (ORDER BY periodo)) AS diferencia,
        CASE 
          WHEN (existencia_mes - LAG(existencia_mes, 1, 0) OVER (ORDER BY periodo)) > 0 THEN 'subió'
          WHEN (existencia_mes - LAG(existencia_mes, 1, 0) OVER (ORDER BY periodo)) < 0 THEN 'bajó'
          ELSE 'igual'
        END AS tendencia
      FROM datos_mensuales
      ORDER BY periodo;
    `);

    // 5. Gráfico de pie - Existencias por ubicación
    const pieChartData: any[] = await db.$queryRawUnsafe(`
      SELECT
        CONCAT(u.rack, u.fila) AS ubicacion,
        SUM(r.existenciaFisica) AS totalExistencias
      FROM refacciones_l3 r
      INNER JOIN ubicacion u ON r.ubicacionId = u.id
      ${whereClausePie}
      GROUP BY ubicacion
      ORDER BY totalExistencias DESC;
    `);

    // 6. Productos críticos (existencia baja)
    const criticosData: any[] = await db.$queryRawUnsafe(`
      SELECT
        r.codigo,
        r.descripcion,
        r.existenciaFisica,
        CONCAT(u.rack, u.fila) AS ubicacion
      FROM refacciones_l3 r
      INNER JOIN ubicacion u ON r.ubicacionId = u.id
      WHERE r.existenciaFisica BETWEEN 0 AND 5
      ${anio || mes || ubicacion ? 'AND ' + condiciones.join(' AND ') : ''}
      ORDER BY r.existenciaFisica ASC
      LIMIT 20;
    `);

    // Formateo de datos para la respuesta
    const formattedData = {
      kpi: {
        totalExistencias: Number(kpiData[0]?.totalExistencias) || 0,
        existenciasCero: Number(kpiData[0]?.existenciasCero) || 0,
        existenciasCriticas: Number(kpiData[0]?.existenciasCriticas) || 0,
        totalProductos: Number(kpiData[0]?.totalProductos) || 0
      },
      ubicaciones: ubicaciones.map(u => u.ubicacion),
      charts: {
        barChart: {
          labels: barChartData.map(item => `${item.codigo} - ${item.descripcion}`.slice(0, 30) + (item.descripcion.length > 30 ? '...' : '')),
          datasets: [
            {
              label: 'Existencias',
              data: barChartData.map(item => Number(item.existenciaFisica) || 0),
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            }
          ]
        },
        lineChart: {
          labels: lineChartData.map(item => item.periodo),
          datasets: [
            {
              label: 'Existencias',
              data: lineChartData.map(item => ({
                x: item.periodo,
                y: Number(item.existencia_acumulada) || 0,
                existencia_mes: Number(item.existencia_mes) || 0,
                diferencia: Number(item.diferencia) || 0,
                tendencia: item.tendencia
              })),
              fill: false,
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              borderColor: 'rgba(75, 192, 192, 1)',
              tension: 0.1
            }
          ],
          // Metadatos adicionales para el tooltip
          metadata: lineChartData.map(item => ({
            periodo: item.periodo,
            existencia_mes: Number(item.existencia_mes) || 0,
            existencia_acumulada: Number(item.existencia_acumulada) || 0,
            diferencia: Number(item.diferencia) || 0,
            tendencia: item.tendencia
          }))
        },
        pieChart: {
          labels: pieChartData.map(item => item.ubicacion),
          datasets: [
            {
              label: 'Existencias por Ubicación',
              data: pieChartData.map(item => Number(item.totalExistencias) || 0),
              backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)'
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 1
            }
          ]
        }
      },
      topItems: {
        criticos: criticosData.map(item => ({
          codigo: item.codigo,
          descripcion: item.descripcion,
          existenciaFisica: Number(item.existenciaFisica) || 0,
          ubicacion: item.ubicacion
        }))
      }
    };

    return NextResponse.json(formattedData);
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