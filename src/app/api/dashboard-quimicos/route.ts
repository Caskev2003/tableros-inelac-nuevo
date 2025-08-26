import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const anio = url.searchParams.get("anio");
    const mes = url.searchParams.get("mes");
    const estado = url.searchParams.get("estado");

    let condiciones: string[] = [];
    let condicionesPie: string[] = [];
    
    if (anio) {
      const cond = `YEAR(q.fechaIngreso) = '${anio}'`;
      condiciones.push(cond);
      condicionesPie.push(cond);
    }
    if (mes) {
      const cond = `MONTH(q.fechaIngreso) = '${mes}'`;
      condiciones.push(cond);
      condicionesPie.push(cond);
    }

    // Agregar condición de estado a todas las consultas principales
    if (estado) {
      let condEstado = '';
      if (estado === "vigente") {
        condEstado = "(q.fechaVencimiento IS NULL OR q.fechaVencimiento > DATE_ADD(CURDATE(), INTERVAL 30 DAY))";
      } else if (estado === "por-vencer") {
        condEstado = "q.fechaVencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)";
      } else if (estado === "caducado") {
        condEstado = "q.fechaVencimiento < CURDATE()";
      }
      
      if (condEstado) {
        condiciones.push(condEstado);
        condicionesPie.push(condEstado);
      }
    }
    
    const whereClause = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const whereClausePie = condicionesPie.length ? `WHERE ${condicionesPie.join(' AND ')}` : '';

    console.log('Where clause principal:', whereClause);

    // 1. KPI - Datos generales (AHORA CON FILTRO DE ESTADO)
    const kpiData: any[] = await db.$queryRawUnsafe(`
      SELECT
        SUM(q.existenciaFisica) AS totalExistencias,
        AVG(q.existenciaFisica) AS promedioExistencias,
        SUM(CASE WHEN q.existenciaFisica = 0 THEN 1 ELSE 0 END) AS existenciasCero,
        SUM(CASE WHEN q.existenciaFisica BETWEEN 1 AND 5 THEN 1 ELSE 0 END) AS existenciasCriticas,
        SUM(CASE WHEN q.existenciaFisica < 10 THEN 1 ELSE 0 END) AS existenciasBajo10,
        SUM(q.retenidos) AS retenidos,
        COUNT(DISTINCT q.noLote) AS productosTotales
      FROM quimicos q
      ${whereClause};
    `);

    // 2. Gráfico de barras - Top 10 productos con más existencias (AHORA CON FILTRO DE ESTADO)
    const barChartData: any[] = await db.$queryRawUnsafe(`
      SELECT
        q.codigo,
        q.descripcion,
        q.existenciaFisica,
        q.noLote,
        q.movimiento
      FROM quimicos q
      ${whereClause}
      ORDER BY q.existenciaFisica DESC
      LIMIT 10;
    `);

    console.log('Top 10 productos:', barChartData);

    // 3. Gráfico de líneas - Evolución histórica (AHORA CON FILTRO DE ESTADO)
    const lineChartData: any[] = await db.$queryRawUnsafe(`
      WITH datos_mensuales AS (
        SELECT
          DATE_FORMAT(q.fechaIngreso, '%Y-%m') AS periodo,
          YEAR(q.fechaIngreso) AS anio,
          MONTH(q.fechaIngreso) AS mes,
          SUM(q.existenciaFisica) AS existencia_mes
        FROM quimicos q
        ${whereClause}
        GROUP BY DATE_FORMAT(q.fechaIngreso, '%Y-%m'), YEAR(q.fechaIngreso), MONTH(q.fechaIngreso)
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

    console.log('Datos de línea crudos:', JSON.stringify(lineChartData, null, 2));

    // 4. Gráfico de pie - Distribución por movimiento (AHORA CON FILTRO DE ESTADO)
    const pieChartData: any[] = await db.$queryRawUnsafe(`
      SELECT
        q.movimiento,
        SUM(q.existenciaFisica) AS totalExistencias
      FROM quimicos q
      ${whereClausePie}
      GROUP BY q.movimiento
      ORDER BY totalExistencias DESC;
    `);

    // 5. Productos críticos con estado (vigente, por-vencer, caducado) - FILTRO ORIGINAL
    let condicionesCriticos = "WHERE q.existenciaFisica < 10";
    if (estado) {
      if (estado === "vigente") {
        condicionesCriticos += " AND (q.fechaVencimiento IS NULL OR q.fechaVencimiento > DATE_ADD(CURDATE(), INTERVAL 30 DAY))";
      } else if (estado === "por-vencer") {
        condicionesCriticos += " AND q.fechaVencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)";
      } else if (estado === "caducado") {
        condicionesCriticos += " AND q.fechaVencimiento < CURDATE()";
      }
    }

    const criticosData: any[] = await db.$queryRawUnsafe(`
      SELECT
        q.codigo,
        q.descripcion,
        q.existenciaFisica,
        q.noLote,
        q.fechaVencimiento,
        CASE 
          WHEN q.fechaVencimiento IS NULL OR q.fechaVencimiento > DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Vigente'
          WHEN q.fechaVencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 Day) THEN 'Por Vencer'
          WHEN q.fechaVencimiento < CURDATE() THEN 'Caducado'
          ELSE 'Vigente'
        END AS estado
      FROM quimicos q
      ${condicionesCriticos}
      ORDER BY q.existenciaFisica ASC
      LIMIT 20;
    `);

    // 6. Productos próximos a vencer (AHORA CON FILTRO DE ESTADO)
    let condicionesProximosVencer = "WHERE q.fechaVencimiento BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 MONTH)";
    if (estado) {
      if (estado === "vigente") {
        condicionesProximosVencer += " AND (q.fechaVencimiento IS NULL OR q.fechaVencimiento > DATE_ADD(CURDATE(), INTERVAL 30 DAY))";
      } else if (estado === "por-vencer") {
        condicionesProximosVencer += " AND q.fechaVencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)";
      } else if (estado === "caducado") {
        condicionesProximosVencer += " AND q.fechaVencimiento < CURDATE()";
      }
    }

    const proximosVencerData: any[] = await db.$queryRawUnsafe(`
      SELECT
        q.codigo,
        q.descripcion,
        q.existenciaFisica,
        q.noLote,
        q.fechaVencimiento,
        CASE 
          WHEN q.fechaVencimiento IS NULL OR q.fechaVencimiento > DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Vigente'
          WHEN q.fechaVencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Por Vencer'
          WHEN q.fechaVencimiento < CURDATE() THEN 'Caducado'
          ELSE 'Vigente'
        END AS estado
      FROM quimicos q
      ${condicionesProximosVencer}
      ${anio || mes ? 'AND ' + condiciones.join(' AND ') : ''}
      ORDER BY q.fechaVencimiento ASC
      LIMIT 10;
    `);

    // Formateamos los datos para que coincidan con lo que espera el frontend
    const formattedData = {
      kpi: {
        totalExistencias: Number(kpiData[0]?.totalExistencias) || 0,
        promedio: Number(kpiData[0]?.promedioExistencias) || 0,
        existenciasCero: Number(kpiData[0]?.existenciasCero) || 0,
        existenciasCriticas: Number(kpiData[0]?.existenciasCriticas) || 0,
        existenciasBajo10: Number(kpiData[0]?.existenciasBajo10) || 0,
        retenidos: Number(kpiData[0]?.retenidos) || 0,
        productosTotales: Number(kpiData[0]?.productosTotales) || 0
      },
      charts: {
        barChart: {
          labels: barChartData.map(item => 
            `${item.codigo} - ${item.descripcion?.slice(0, 30)}${item.descripcion?.length > 30 ? '...' : ''}`
          ),
          datasets: [
            {
              label: 'Existencias',
              data: barChartData.map(item => Number(item.existenciaFisica) || 0),
              backgroundColor: 'rgba(79, 70, 229, 0.5)',
              borderColor: 'rgba(79, 70, 229, 1)',
              borderWidth: 2,
              meta: barChartData.map(item => ({
                codigo: item.codigo,
                descripcion: item.descripcion,
                noLote: item.noLote,
                movimiento: item.movimiento
              }))
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
          labels: pieChartData.map(item => item.movimiento),
          datasets: [
            {
              label: 'Distribución por Movimiento',
              data: pieChartData.map(item => Number(item.totalExistencias) || 0),
              backgroundColor: pieChartData.map(item => {
                switch(item.movimiento) {
                  case 'ENTRADA': return 'rgba(16, 185, 129, 0.7)';
                  case 'SALIDA': return 'rgba(239, 68, 68, 0.7)';
                  case 'NUEVO_INGRESO': return 'rgba(59, 130, 246, 0.7)';
                  case 'EDITADO': return 'rgba(245, 158, 11, 0.7)';
                  default: return 'rgba(156, 163, 175, 0.7)';
                }
              }),
              borderColor: '#fff',
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
          noLote: item.noLote,
          estado: item.estado
        })),
        proximosVencer: proximosVencerData.map(item => ({
          codigo: item.codigo,
          descripcion: item.descripcion,
          existenciaFisica: Number(item.existenciaFisica) || 0,
          noLote: item.noLote,
          estado: item.estado,
          diasRestantes: item.fechaVencimiento 
            ? Math.ceil((new Date(item.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
            : null
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