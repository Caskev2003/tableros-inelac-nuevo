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
  existenciasCero: number;
  existenciasCriticas: number;
  rotacionPromedio: number;
  totalProductos: number;
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
  }[];
}

interface TopItem {
  codigo: string;
  descripcion: string;
  existenciaFisica: number;
  ubicacion: string;
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
  };
  ubicaciones: string[];
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

const DashboardRefacciones = () => {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [filtroUbicacion, setFiltroUbicacion] = useState<string>("");
  const [filtroMes, setFiltroMes] = useState<string>("");
  const [filtroAnio, setFiltroAnio] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tabla de ubicaciones completa
  const ubicacionesCompletas = [
    "1A", "1B", "1C", "1D", "1E",
    "2A", "2B", "2C",
    "3A", "3B", "3C",
    "4A", "4B", "4C",
    "5A", "5B", "5C",
    "6A", "6B", "6C",
    "7A", "7B", "7C", "7D", "7E",
    "8A", "8B", "8C",
    "9A", "9B", "9C",
    "10A", "10B", "10C",
    "11A", "11B", "11C",
    "12A", "12B", "12C",
    "13A", "13B", "13C",
    "14A", "14B", "14C",
    "15A", "15B", "15C",
    "16A", "16B", "16C",
    "17A", "17B", "17C",
    "18A", "18B", "18C",
    "19A", "19B", "19C", "19D", "19E",
    "20A", "20B", "20C", "20D", "20E",
    "21A", "00PISO"
  ];

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let queryParams = [];
      if (filtroAnio) queryParams.push(`anio=${filtroAnio}`);
      if (filtroMes) queryParams.push(`mes=${filtroMes}`);
      if (filtroUbicacion) queryParams.push(`ubicacion=${filtroUbicacion}`);
      
      const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';
      const response = await fetch(`/api/dashboard-refacciones${queryString}`, { 
        cache: "no-store",
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("No se pudieron cargar los datos. Por favor intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // Actualizar cada 5 minutos
    return () => clearInterval(interval);
  }, [filtroUbicacion, filtroMes, filtroAnio]);

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
      existenciasCero: 0,
      existenciasCriticas: 0,
      rotacionPromedio: 0,
      totalProductos: 0
    },
    charts = {
      barChart: { labels: [], datasets: [] },
      lineChart: { labels: [], datasets: [] },
      pieChart: { labels: [], datasets: [] }
    },
    topItems = { criticos: [] },
    ubicaciones = [] 
  } = dashboardData;

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
        grid: {
          color: '#E5E7EB'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Productos',
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

  const lineChartOptions = {
    ...commonChartOptions,
    plugins: {
      ...commonChartOptions.plugins,
      title: {
        display: true,
        text: 'Evolución Acumulada de Existencias',
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
              `Existencia mes: ${rawData.existencia_mes}`,
              `Acumulado: ${rawData.existencia_acumulada}`,
              `Tendencia: ${rawData.tendencia} (${rawData.diferencia >= 0 ? '+' : ''}${rawData.diferencia})`
            ];
          },
          afterLabel: (context: any) => {
            const rawData = context.dataset.data[context.dataIndex];
            const prevValue = rawData.existencia_acumulada - rawData.diferencia;
            const percentageChange = prevValue !== 0 
              ? (rawData.diferencia / prevValue) * 100 
              : 0;
            
            
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
    },
  };

  const pieChartOptions = {
    ...commonChartOptions,
    plugins: {
      ...commonChartOptions.plugins,
      title: {
        display: true,
        text: 'Distribución por Ubicación',
        font: {
          size: 18,
          weight: 'bold' as const
        },
        color: COLORS.dark
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw.toLocaleString();
            const percentage = (
              (context.raw / context.dataset.data.reduce((a: number, b: number) => a + b, 0)) * 100
            ).toFixed(2);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  const meses = [
    "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const anios = ["", "2023", "2024", "2025"];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg shadow-lg p-6 mb-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard de Inventario - Bodega L3</h1>
            <p className="text-blue-100">Monitoreo en tiempo real del inventario de refacciones</p>
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
              {anios.map((anio) => (
                <option key={anio} value={anio === "" ? "" : anio.slice(-2)}>
                  {anio === "" ? "Todos los años" : anio}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-800 bg-white"
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
            >
              {meses.map((mes, index) => (
                <option key={index} value={index === 0 ? "" : String(index).padStart(2, '0')}>
                  {mes === "" ? "Todos los meses" : mes}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-800 bg-white"
              value={filtroUbicacion}
              onChange={(e) => setFiltroUbicacion(e.target.value)}
            >
              <option value="">Todas las ubicaciones</option>
              {ubicacionesCompletas.map((ubicacion) => (
                <option key={ubicacion} value={ubicacion}>{ubicacion}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFiltroAnio("");
                setFiltroMes("");
                setFiltroUbicacion("");
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
            <h3 className="text-lg font-semibold text-amber-800">Existencias críticas</h3>
            <div className="bg-amber-200 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-amber-900 mb-2">{(kpi?.existenciasCriticas || 0).toLocaleString()}</p>
          <p className="text-sm text-amber-700">Unidades entre 1-5 en stock</p>
        </div>

        {/* KPI 4: Rotación */}
        <div className="bg-gradient-to-br from-green-100 to-teal-100 rounded-xl shadow-md p-6 flex flex-col border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-800">Total de Productos</h3>
            <div className="bg-green-200 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-green-900 mb-2">{(kpi?.totalProductos || 0).toLocaleString()}</p>
          <p className="text-sm text-green-700">Productos diferentes en inventario</p>
        </div>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de barras - Top 10 productos */}
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
                  }]
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

        {/* Gráfico de líneas - Evolución acumulada */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="h-96">
            {charts?.lineChart?.datasets?.length > 0 ? (
              <Line 
                data={{
                  labels: charts.lineChart.labels,
                  datasets: [{
                    label: 'Existencias Acumuladas',
                    data: charts.lineChart.datasets[0].data,
                    backgroundColor: COLORS.primary + '20',
                    borderColor: COLORS.primary,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: COLORS.primary,
                    pointBorderColor: '#fff',
                    pointHoverRadius: 8,
                    pointRadius: 5
                  }]
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
        {/* Distribución por ubicación */}
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

        {/* Top artículos con más movimiento */}
        <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Artículos con stock crítico</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-indigo-600 to-blue-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Existencia</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Ubicación</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topItems?.criticos?.length > 0 ? (
                  topItems.criticos.map((item: any) => (
                    <tr key={item.codigo} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.codigo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.descripcion}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full 
                          ${item.existenciaFisica === 0 ? 'bg-red-100 text-red-800' : 
                            item.existenciaFisica < 5 ? 'bg-amber-100 text-amber-800' : 
                            'bg-green-100 text-green-800'}`}>
                          {item.existenciaFisica}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                          {item.ubicacion}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No hay artículos con stock crítico
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

export default DashboardRefacciones;