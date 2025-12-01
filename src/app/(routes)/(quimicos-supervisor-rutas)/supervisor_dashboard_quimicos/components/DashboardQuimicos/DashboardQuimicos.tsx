'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
} from "chart.js";
import { Navbar } from "@/components/shared/Navbar";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
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
    data: any[];
    backgroundColor: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
    meta?: any[];
  }[];
}

interface CriticoItem {
  codigo: number;
  descripcion: string;
  existenciaFisica: number;
  noLote: string;
  estado: string;
}

interface ProximoVencerItem {
  codigo: number;
  descripcion: string;
  existenciaFisica: number;
  noLote: string;
  estado: string;
  diasRestantes: number | null;
}

interface RetenidoItem {
  codigo: number;
  descripcion: string;
  existenciaFisica: number;
  noLote: string;
  retenidos: number;
}

interface DashboardData {
  kpi: KpiData;
  charts: {
    barChart: ChartData;
    lineChart: ChartData;
    pieChart: ChartData;
  };
  topItems: {
    criticos: CriticoItem[];
    proximosVencer: ProximoVencerItem[];
    retenidos: RetenidoItem[];
  };
}

// Paleta de colores
const COLORS = {
  primary: '#4F46E5',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F97316',
  info: '#3B82F6',
  success: '#22C55E',
  dark: '#1F2937',
  light: '#F3F4F6',
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
  const [filtroEstado, setFiltroEstado] = useState<string>("");
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
    topItems = { criticos: [], proximosVencer: [], retenidos: [] }
  } = dashboardData as DashboardData;

  // Opciones comunes
  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 14,
            weight: 'bold' as const
          }
        }
      }
    }
  };

  const barChartOptions = {
    ...commonChartOptions,
    plugins: {
      ...commonChartOptions.plugins,
      title: {
        display: true,
        text: 'Top 10 Productos con Más Existencia',
        font: {
          size: 18,
          weight: 'bold' as const
        },
        color: COLORS.dark
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.raw.toLocaleString();
            return `${label}: ${value} unidades`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cantidad',
          font: {
            weight: 'bold' as const
          }
        },
        grid: { color: '#E5E7EB' }
      },
      x: {
        title: {
          display: true,
          text: 'Productos',
          font: {
            weight: 'bold' as const
          }
        },
        grid: { color: '#E5E7EB' }
      }
    }
  };

  const lineChartOptions = {
    ...commonChartOptions,
    plugins: {
      ...commonChartOptions.plugins,
      title: {
        display: true,
        text: 'Tendencia por mes de las existencias de Químicos',
        font: {
          size: 18,
          weight: 'bold' as const
        },
        color: COLORS.dark
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const rawData = context.dataset.data[context.dataIndex];
            return [
              `Existencia ingresadas en el mes: ${rawData.existencia_mes}`,
              `Existencia total: ${rawData.y}`,
              `Tendencia: ${rawData.tendencia} (${rawData.diferencia >= 0 ? '+' : ''}${rawData.diferencia})`
            ];
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        displayColors: false,
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Existencias Acumuladas',
          font: {
            weight: 'bold' as const
          }
        },
        grid: { color: '#E5E7EB' }
      },
      x: {
        title: {
          display: true,
          text: 'Periodo',
          font: {
            weight: 'bold' as const
          }
        },
        grid: { color: '#E5E7EB' }
      }
    },
    elements: {
      line: {
        tension: 0.3,
        borderWidth: 3
      },
      point: {
        radius: 5,
        hoverRadius: 8,
        backgroundColor: COLORS.primary,
        borderColor: '#fff',
        borderWidth: 2
      }
    }
  };

  const meses = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                 "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
    <Navbar/>
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
              Actualizar
            </button>
            <button
              onClick={() => router.back()}
              className="flex items-center bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
            >
              Regresar
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
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
        {/* KPI 1 */}
        <div className="bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl shadow-md p-6 flex flex-col border border-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-indigo-800">Existencias Totales</h3>
          </div>
          <p className="text-4xl font-bold text-indigo-900 mb-2">{(kpi?.totalExistencias || 0).toLocaleString()}</p>
          <p className="text-sm text-indigo-700">Unidades en inventario</p>
        </div>

        {/* KPI 2 */}
        <div className="bg-gradient-to-br from-red-100 to-pink-100 rounded-xl shadow-md p-6 flex flex-col border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-800">Artículos agotados</h3>
          </div>
          <p className="text-4xl font-bold text-red-900 mb-2">{(kpi?.existenciasCero || 0).toLocaleString()}</p>
          <p className="text-sm text-red-700">Necesitan reabastecimiento</p>
        </div>

        {/* KPI 3 */}
        <div className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl shadow-md p-6 flex flex-col border border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-amber-800">Existencias bajo 10</h3>
          </div>
          <p className="text-4xl font-bold text-amber-900 mb-2">{(kpi?.existenciasBajo10 || 0).toLocaleString()}</p>
          <p className="text-sm text-amber-700">Unidades con stock bajo</p>
        </div>

        {/* KPI 4 */}
        <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl shadow-md p-6 flex flex-col border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-purple-800">Productos Totales</h3>
          </div>
          <p className="text-4xl font-bold text-purple-900 mb-2">{(kpi?.productosTotales || 0).toLocaleString()}</p>
          <p className="text-sm text-purple-700">Total de productos en inventario</p>
        </div>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Barras */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="h-96">
            {charts?.barChart?.datasets?.length > 0 ? (
              <Bar 
                data={{
                  labels: charts.barChart.labels,
                  datasets: [{
                    ...charts.barChart.datasets[0],
                    backgroundColor: COLORS.chart.slice(0, 10),
                    borderColor: COLORS.dark,
                    borderWidth: 1
                  }]}
                }
                options={barChartOptions}
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No hay datos para mostrar</p>
              </div>
            )}
          </div>
        </div>

        {/* Línea */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="h-96">
            {charts?.lineChart?.datasets?.length > 0 ? (
              <Line 
                data={{
                  labels: charts.lineChart.labels,
                  datasets: charts.lineChart.datasets.map(dataset => ({
                    ...dataset,
                    backgroundColor: COLORS.success,
                    borderColor: COLORS.success,
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

      {/* Sección inferior: dos tablas lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabla de críticos */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
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
                  topItems.criticos.map((item) => (
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

        {/* Tabla de productos retenidos */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Productos con retenidos</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-red-600 to-rose-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">No. Lote</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Retenidos</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topItems?.retenidos?.length > 0 ? (
                  topItems.retenidos.map((item) => (
                    <tr key={`${item.codigo}-${item.noLote}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.codigo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.descripcion}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.noLote}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {item.retenidos}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No hay productos con retenidos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Última actualización: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default DashboardQuimicos;
