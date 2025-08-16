'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

interface KpiData {
  totalExistencias: number;
  promedio: number;
  existenciasCero: number;
  existenciasCriticas: number;
  existenciasBajo10: number;
  retenidos: number;
  productosTotales: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
    meta?: any[];
  }[];
}

interface TopItem {
  codigo: number;
  descripcion: string;
  existenciaFisica: number;
  noLote: string;
}

interface DashboardData {
  kpi: KpiData;
  charts: {
    barChart: ChartData;
    lineChart: ChartData;
    pieChart: ChartData;
  };
  topItems: {
    criticos: TopItem[];
    proximosVencer: TopItem[];
  };
}

// Paleta de colores mejorada
const COLORS = {
  primary: '#4F46E5',    // Indigo
  secondary: '#10B981',  // Emerald
  accent: '#F59E0B',     // Amber
  danger: '#EF4444',     // Red
  warning: '#F97316',    // Orange
  info: '#3B82F6',      // Blue
  success: '#22C55E',    // Green
  dark: '#1F2937',       // Gray-800
  light: '#F3F4F6',      // Gray-100
  chart: [
    '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', 
    '#22C55E', '#F97316', '#8B5CF6', '#EC4899', '#14B8A6'
  ]
};

const DashboardQuimicos = () => {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [filtroMes, setFiltroMes] = useState<string>("");
  const [filtroAnio, setFiltroAnio] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<string>(""); // Nuevo estado para el filtro
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filtroAnio) params.append('anio', filtroAnio);
      if (filtroMes) params.append('mes', filtroMes);
      if (filtroEstado) params.append('estado', filtroEstado);

      const url = `/api/dashboard-quimicos?${params.toString()}`;
      console.log('Fetching data from:', url);

      const response = await fetch(url, { 
        cache: "no-store",
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          errorData.message || 
          `Error ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log('Data received:', data);

      if (!data) {
        throw new Error("La API no devolvió datos");
      }

      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(
        error instanceof Error ? 
        error.message : 
        "No se pudieron cargar los datos. Por favor intenta nuevamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [filtroMes, filtroAnio, filtroEstado]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <button
          onClick={fetchData}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">No se encontraron datos para mostrar</p>
      </div>
    );
  }

  // Datos con valores por defecto para evitar undefined
  const { 
    kpi = {
      totalExistencias: 0,
      promedio: 0,
      existenciasCero: 0,
      existenciasCriticas: 0,
      existenciasBajo10: 0,
      retenidos: 0,
      productosTotales: 0
    },
    charts = {
      barChart: { labels: [], datasets: [] },
      lineChart: { labels: [], datasets: [] },
      pieChart: { labels: [], datasets: [] }
    },
    topItems = { criticos: [], proximosVencer: [] }
  } = dashboardData;

// Configuración corregida para los gráficos
const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        font: {
          size: 14,
          weight: 'bold' as const // Especificar como constante
        }
      }
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          const dataset = context.dataset;
          const index = context.dataIndex;
          const actual = context.raw;
          const anterior = index > 0 ? dataset.data[index - 1] : 0;
          const cambio = actual - anterior;
          const tendencia = cambio > 0 ? '⬆️ Subió' : cambio < 0 ? '⬇️ Bajó' : '➡️ Igual';
          const cantidadMes = dataset.meta?.[index]?.existencia ?? 'N/A';

          return [
            `Acumulado: ${actual}`,
            `En el mes: ${cantidadMes}`,
            `Tendencia: ${tendencia}`
          ];
        }
      },
      titleFont: {
        size: 16 as number // Asegurar el tipo number
      },
      bodyFont: {
        size: 14 as number // Asegurar el tipo number
      }
    }
  }
};

// Opciones específicas para gráfico de barras - Corregido
const barChartOptions = {
  ...commonChartOptions,
  plugins: {
    ...commonChartOptions.plugins,
    title: {
      display: true,
      text: 'Existencias Acumuladas de Químicos',
      font: {
        size: 18 as number,
        weight: 'bold' as const
      },
      color: COLORS.dark
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Cantidad',
        font: {
          weight: 'bold' as const // Especificar como constante
        }
      },
      grid: {
        color: '#E5E7EB'
      }
    },
    x: {
      title: {
        display: true,
        text: 'Periodo',
        font: {
          weight: 'bold' as const // Especificar como constante
        }
      },
      grid: {
        color: '#E5E7EB'
      }
    }
  }
};

// Opciones para gráfico de líneas - Corregido
const lineChartOptions = {
  ...commonChartOptions,
  plugins: {
    ...commonChartOptions.plugins,
    title: {
      display: true,
      text: 'Tendencia de Existencias',
      font: {
        size: 18 as number,
        weight: 'bold' as const
      },
      color: COLORS.dark
    }
  },
  scales: {
    y: {
      beginAtZero: false,
      title: {
        display: true,
        text: 'Cantidad',
        font: {
          weight: 'bold' as const
        }
      },
      grid: {
        color: '#E5E7EB'
      }
    },
    x: {
      title: {
        display: true,
        text: 'Periodo',
        font: {
          weight: 'bold' as const
        }
      },
      grid: {
        color: '#E5E7EB'
      }
    }
  }
};

// Opciones para gráfico de pie - Corregido
const pieChartOptions = {
  ...commonChartOptions,
  plugins: {
    ...commonChartOptions.plugins,
    title: {
      display: true,
      text: 'Distribución por Movimiento',
      font: {
        size: 18 as number,
        weight: 'bold' as const
      },
      color: COLORS.dark
    }
  }
};

  const meses = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const anios = ["", "2023", "2024", "2025"];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg shadow-lg p-6 mb-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard de Inventario - Químicos</h1>
            <p className="text-blue-100">Monitoreo en tiempo real del inventario de químicos</p>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
            <button
              onClick={fetchData}
              className="flex items-center bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Actualizar
            </button>
            <button
              onClick={() => router.push("/gestion_almacen")}
              className="flex items-center bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Regresar
            </button>
          </div>
        </div>
      </div>

      {/* Filtros actualizados */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-800 bg-white"
              value={filtroAnio}
              onChange={(e) => setFiltroAnio(e.target.value)}
            >
              <option value="">Todos los años</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-800 bg-white"
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
            >
              <option value="">Todos los meses</option>
              {meses.map((mes, index) => (
                <option key={index} value={index === 0 ? "" : String(index).padStart(2, '0')}>
                  {mes}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-800 bg-white"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="vigente">Vigente</option>
              <option value="por-vencer">Por Vencer (30 días)</option>
              <option value="caducado">Caducado</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFiltroAnio("");
                setFiltroMes("");
                setFiltroEstado("");
              }}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg transition-colors font-medium"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* KPI 1: Total de Existencias */}
        <div className="bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl shadow-md p-6 flex flex-col border border-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-indigo-800">Existencias Totales</h3>
            <div className="bg-indigo-200 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-indigo-900 mb-2">{(kpi?.totalExistencias || 0).toLocaleString()}</p>
          <p className="text-sm text-indigo-700">Unidades en inventario</p>
        </div>

        {/* KPI 2: Artículos sin existencia */}
        <div className="bg-gradient-to-br from-red-100 to-pink-100 rounded-xl shadow-md p-6 flex flex-col border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-800">Artículos agotados</h3>
            <div className="bg-red-200 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-red-900 mb-2">{(kpi?.existenciasCero || 0).toLocaleString()}</p>
          <p className="text-sm text-red-700">Necesitan reabastecimiento</p>
        </div>

        {/* KPI 3: Artículos críticos */}
        <div className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl shadow-md p-6 flex flex-col border border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-amber-800">Existencias bajo 10</h3>
            <div className="bg-amber-200 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-amber-900 mb-2">{(kpi?.existenciasBajo10 || 0).toLocaleString()}</p>
          <p className="text-sm text-amber-700">Unidades con stock bajo</p>
        </div>

        {/* KPI 4: Productos totales (antes retenidos) */}
        <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl shadow-md p-6 flex flex-col border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-purple-800">Productos Totales</h3>
            <div className="bg-purple-200 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-purple-900 mb-2">{(kpi?.productosTotales || 0).toLocaleString()}</p>
          <p className="text-sm text-purple-700">Total de productos en inventario</p>
        </div>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de barras - Existencias acumuladas */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="h-96">
            {charts?.barChart?.datasets?.length > 0 ? (
              <Bar 
                data={{
                  ...charts.barChart,
                  datasets: charts.barChart.datasets.map(dataset => ({
                    ...dataset,
                    backgroundColor: COLORS.primary,
                    borderColor: COLORS.dark,
                    borderWidth: 2
                  }))
                }} 
                options={barChartOptions} 
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No hay datos para mostrar</p>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de líneas - Tendencia */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="h-96">
            {charts?.lineChart?.datasets?.length > 0 ? (
              <Line 
                data={{
                  ...charts.lineChart,
                  datasets: charts.lineChart.datasets.map(dataset => ({
                    ...dataset,
                    backgroundColor: dataset.label === 'Entradas' ? COLORS.success : COLORS.danger,
                    borderColor: dataset.label === 'Entradas' ? COLORS.success : COLORS.danger,
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4
                  }))
                }} 
                options={lineChartOptions} 
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No hay datos para mostrar</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sección inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribución por mes */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="h-96">
            {charts?.pieChart?.datasets?.length > 0 ? (
              <Pie 
                data={{
                  ...charts.pieChart,
                  datasets: charts.pieChart.datasets.map(dataset => ({
                    ...dataset,
                    backgroundColor: COLORS.chart,
                    borderColor: '#fff',
                    borderWidth: 2
                  }))
                }} 
                options={pieChartOptions} 
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No hay datos para mostrar</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabla de productos críticos con columna de estado */}
      <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Productos con stock crítico</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-indigo-600 to-blue-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">No. Lote</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Existencia</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topItems?.criticos?.length > 0 ? (
                topItems.criticos.map((item: any) => (
                  <tr key={`${item.codigo}-${item.noLote}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.codigo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.descripcion}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.noLote}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full 
                        ${item.existenciaFisica === 0 ? 'bg-red-100 text-red-800' : 
                          item.existenciaFisica < 5 ? 'bg-amber-100 text-amber-800' : 
                          'bg-green-100 text-green-800'}`}>
                        {item.existenciaFisica}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full 
                        ${item.estado === 'Caducado' ? 'bg-red-100 text-red-800' : 
                          item.estado === 'Por Vencer' ? 'bg-amber-100 text-amber-800' : 
                          'bg-green-100 text-green-800'}`}>
                        {item.estado}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay productos con stock crítico
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Última actualización: {new Date().toLocaleString()}</p>
      </div>
    </div>
  </div>
  );
};

export default DashboardQuimicos;