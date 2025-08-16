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
    
    const whereClause = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const whereClausePie = condicionesPie.length ? `WHERE ${condicionesPie.join(' AND ')}` : '';

    // 1. KPI - Agregamos productosTotales que el frontend espera
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

    // Gráfico de barras - Existencias acumuladas por mes
    const barChartData: any[] = await db.$queryRawUnsafe(`
      SELECT
        DATE_FORMAT(q.fechaIngreso, '%Y-%m') AS periodo,
        SUM(q.existenciaFisica) AS totalExistencias,
        SUM(CASE WHEN MONTH(q.fechaIngreso) = MONTH(CURRENT_DATE()) 
                 THEN q.existenciaFisica ELSE 0 END) AS existenciaMesActual
      FROM quimicos q
      ${whereClause}
      GROUP BY periodo
      ORDER BY periodo;
    `);

    // Gráfico de líneas - Tendencia de movimientos
    const lineChartData: any[] = await db.$queryRawUnsafe(`
      SELECT
        DATE_FORMAT(q.fechaIngreso, '%Y-%m') AS periodo,
        SUM(CASE WHEN q.movimiento = 'ENTRADA' THEN q.existenciaFisica ELSE 0 END) AS entradas,
        SUM(CASE WHEN q.movimiento = 'SALIDA' THEN q.existenciaFisica ELSE 0 END) AS salidas
      FROM quimicos q
      ${whereClause}
      GROUP BY periodo
      ORDER BY periodo;
    `);

    // Gráfico de pie - Distribución por movimiento
    const pieChartData: any[] = await db.$queryRawUnsafe(`
      SELECT
        q.movimiento,
        SUM(q.existenciaFisica) AS totalExistencias
      FROM quimicos q
      ${whereClausePie}
      GROUP BY q.movimiento
      ORDER BY totalExistencias DESC;
    `);

    // Productos críticos con estado (vigente, por-vencer, caducado)
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
          WHEN q.fechaVencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Por Vencer'
          WHEN q.fechaVencimiento < CURDATE() THEN 'Caducado'
          ELSE 'Vigente'
        END AS estado
      FROM quimicos q
      ${condicionesCriticos}
      ORDER BY q.existenciaFisica ASC
      LIMIT 20;
    `);

    // Productos próximos a vencer (sin filtro de estado)
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
      WHERE q.fechaVencimiento BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 MONTH)
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
          labels: barChartData.map(item => item.periodo),
          datasets: [
            {
              label: 'Existencias Totales',
              data: barChartData.map(item => Number(item.totalExistencias) || 0),
              backgroundColor: 'rgba(79, 70, 229, 0.5)',
              borderColor: 'rgba(79, 70, 229, 1)',
              borderWidth: 2,
              meta: barChartData.map(item => ({
                existencia: Number(item.existenciaMesActual) || 0
              }))
            }
          ]
        },
        lineChart: {
          labels: lineChartData.map(item => item.periodo),
          datasets: [
            {
              label: 'Entradas',
              data: lineChartData.map(item => Number(item.entradas) || 0),
              borderColor: '#10B981',
              backgroundColor: '#10B981',
              borderWidth: 3,
              tension: 0.4,
              fill: false
            },
            {
              label: 'Salidas',
              data: lineChartData.map(item => Number(item.salidas) || 0),
              borderColor: '#EF4444',
              backgroundColor: '#EF4444',
              borderWidth: 3,
              tension: 0.4,
              fill: false
            }
          ]
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