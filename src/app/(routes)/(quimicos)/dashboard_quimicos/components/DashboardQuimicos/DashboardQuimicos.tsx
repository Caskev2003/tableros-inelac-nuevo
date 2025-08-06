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

const DashboardQuimicos = () => {
  const router = useRouter();
  const [kpiData, setKpiData] = useState<any>(null);
  const [barChartData, setBarChartData] = useState<any>(null);
  const [lineChartData, setLineChartData] = useState<any>(null);
  const [filtro, setFiltro] = useState<string>("");
  const [filtroMes, setFiltroMes] = useState<string>("");
  const [filtroAnio, setFiltroAnio] = useState<string>("");

  const fetchData = async () => {
    let query = "";
    if (filtroMes && filtroAnio) {
      query = `?filtro=${filtroAnio}-${filtroMes}`;
    } else if (filtroMes && !filtroAnio) {
      query = `?filtro=${filtroMes}`;
    } else if (filtroAnio) {
      query = `?filtro=${filtroAnio}`;
    } else if (filtro) {
      query = `?filtro=${filtro}`;
    }

    const response = await fetch(`/api/dashboard-quimicos${query}`, { cache: "no-store" });
    const data = await response.json();

    const enrich = (chart: any) => {
      const dataset = chart.datasets[0];
      dataset.meta = dataset.meta?.map((item: any, index: number) =>
        typeof item === 'object' ? item : { existencia: item }
      ) ?? dataset.data.map((val: any) => ({ existencia: val }));
      return chart;
    };

    setKpiData(data.kpi);
    setBarChartData(enrich(data.barChart));
    setLineChartData(enrich(data.lineChart));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [filtro, filtroMes, filtroAnio]);

  if (!kpiData || !barChartData || !lineChartData) {
    return <div>Cargando...</div>;
  }

  const tooltipOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Existencias Totales Acumuladas'
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
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
        }
      }
    }
  };

  const meses = ["", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const anios = ["", "2024", "2025"];

  return (
    <div className="relative p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-center text-xl font-bold">DASHBOARD QUÍMICOS</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            🔄 Actualizar ahora
          </button>
          <button
            onClick={() => router.push("/gestion_almacen")}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Regresar
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="card bg-green-500 text-white p-4 rounded-lg shadow-lg w-full sm:w-1/4">
          <h4 className="text-xl font-bold mb-2">Existencias Totales</h4>
          <p className="text-3xl font-semibold">{kpiData.totalExistencias}</p>
        </div>
        <div className="card bg-red-500 text-white p-4 rounded-lg shadow-lg w-full sm:w-1/4">
          <h4 className="text-xl font-bold mb-2">Artículos sin Existencia</h4>
          <p className="text-3xl font-semibold">{kpiData.existenciasCero}</p>
        </div>
        <div className="card bg-yellow-500 text-white p-4 rounded-lg shadow-lg w-full sm:w-1/4">
          <h4 className="text-xl font-bold mb-2">Existencias Bajo 10</h4>
          <p className="text-3xl font-semibold">{kpiData.existenciasBajo10}</p>
        </div>
        <div className="card bg-purple-500 text-white p-4 rounded-lg shadow-lg w-full sm:w-1/4">
          <h4 className="text-xl font-bold mb-2">Productos Retenidos</h4>
          <p className="text-3xl font-semibold">{kpiData.retenidos}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-4 mb-4">
        <select
          className="bg-black px-3 py-1 border border-gray-300 rounded"
          value={filtroAnio}
          onChange={(e) => setFiltroAnio(e.target.value)}
        >
          {anios.map((anio) => (
            <option key={anio} value={anio}>{anio === "" ? "Año" : anio}</option>
          ))}
        </select>
        <select
          className="bg-black px-3 py-1 border border-gray-300 rounded"
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
        >
          {meses.map((mes) => (
            <option key={mes} value={mes}>{mes === "" ? "Mes" : mes}</option>
          ))}
        </select>
        <button
          onClick={() => {
            setFiltroAnio("");
            setFiltroMes("");
            setFiltro("");
          }}
          className="px-3 py-1 border border-white text-white rounded hover:bg-white hover:text-black transition"
        >
          Todos
        </button>
      </div>

      <div className="mt-8 flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-1/2">
          <Bar data={barChartData} options={tooltipOptions} />
        </div>
        <div className="w-full lg:w-1/2">
          <Line data={lineChartData} options={tooltipOptions} />
        </div>
      </div>

      <div className="mt-10 flex justify-center gap-4">
        <button
          onClick={() => router.push("/dashboard_quimicos/page2")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded inline-flex items-center"
        >
          <span>Siguiente</span>
          <span className="ml-2">➡️</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardQuimicos;