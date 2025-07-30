'use client';

import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import {
  LineChart,
  LineSeriesOption
} from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useRouter } from 'next/navigation';

echarts.use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer
]);

type EChartsOption = echarts.ComposeOption<LineSeriesOption>;

type PuntoDato = {
  mes: string;
  acumulado: number;
  codigo: string;
  descripcion: string;
  existencia: number;
};

type Sugerencia = {
  codigo: string;
  descripcion: string;
};

export default function PaginateDashboard() {
  const chartRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [codigoProducto, setCodigoProducto] = useState('');
  const [datos, setDatos] = useState<Record<string, PuntoDato[]>>({});
  const [titulo, setTitulo] = useState('Tendencia de Existencias Totales');
  const [mensaje, setMensaje] = useState('');
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [comparar, setComparar] = useState(false);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [todosCodigos, setTodosCodigos] = useState<Sugerencia[]>([]);
  const [showSugerencias, setShowSugerencias] = useState<boolean>(false);

  const fetchDatos = async (codigo?: string) => {
    const url = codigo
      ? `/api/dashboard-refacciones?filtro=${codigo}`
      : '/api/dashboard-refacciones';

    const res = await fetch(url);
    const data = await res.json();

    let acumulado = 0;
    const historico: PuntoDato[] = data?.lineChart?.labels?.map(
      (label: string, index: number) => {
        const meta = data.lineChart.datasets[0].meta?.[index] ?? {};
        const existencia = meta.existencia ?? 0;
        acumulado += existencia;
        return {
          mes: label,
          acumulado,
          existencia,
          codigo: meta.codigo ?? codigo ?? 'N/A',
          descripcion: meta.descripcion ?? data.lineChart.datasets[0].label ?? 'Sin descripción'
        };
      }
    ) || [];

    return historico;
  };

  const actualizarGrafica = async () => {
    if (Object.keys(datos).length === 0) return;
    const chart = echarts.init(chartRef.current!);
    chart.clear();

    const series: LineSeriesOption[] = [];
    const todasFechas = new Set<string>();

    Object.entries(datos).forEach(([_codigo, puntos]) => {
      puntos.forEach(p => todasFechas.add(p.mes));
    });

    const fechasOrdenadas = Array.from(todasFechas).sort();
    const fechas = ['Inicio', ...fechasOrdenadas];

    Object.entries(datos).forEach(([codigo, puntos], index) => {
      const acumuladosMap: Record<string, number> = { Inicio: index * 0.1 };
      puntos.forEach(p => acumuladosMap[p.mes] = p.acumulado);
      const valores = fechasOrdenadas.map(m => acumuladosMap[m] ?? null);
      series.push({
        type: 'line',
        data: [0, ...valores],
        smooth: true,
        name: `${codigo} - ${puntos[0].descripcion}`,
        showSymbol: true,
        connectNulls: true,
        lineStyle: { width: 3 },
        animationDuration: 1000,
        emphasis: {
          focus: 'series'
        },
        encode: {
          x: 'mes',
          y: 'acumulado',
          tooltip: ['acumulado', 'existencia']
        }
      });
    });

    const option: EChartsOption = {
      title: { text: titulo },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const contenido = params.map((p: any) => {
            const nombreSerie = p.seriesName.split(' - ')[0];
            const punto = datos[nombreSerie]?.find(pt => pt.acumulado === p.value);
            if (!punto) return '';
            return `
              <strong>${punto.mes}</strong><br/>
              Código: ${punto.codigo}<br/>
              Descripción: ${punto.descripcion}<br/>
              Existencia por mes: ${punto.existencia}<br/>
              Existencia total: ${punto.acumulado}
            `;
          }).join('<br/>');
          return contenido;
        }
      },
      legend: { show: comparar,
        textStyle:{
          color: '#ffffff'
        }
       },
      xAxis: {
        type: 'category',
        data: fechas,
        name: 'Fecha'
      },
      yAxis: {
        type: 'value',
        name: 'Existencias'
      },
      series
    };

    chart.setOption(option);
  };

  const aplicarFiltro = async (codigo: string) => {
    if (!codigo || isNaN(Number(codigo))) return;
    const nuevosDatos = await fetchDatos(codigo);
    if (!nuevosDatos.length) {
      setMensaje('No se encontraron registros para este código.');
      return;
    }
    setMensaje('');
    if (comparar) {
      setDatos(prev => ({ ...prev, [codigo]: nuevosDatos }));
      setSeleccionados(prev => [...new Set([...prev, codigo])]);
    } else {
      setDatos({ [codigo]: nuevosDatos });
      setSeleccionados([codigo]);
    }
  };

  const limpiarFiltro = async () => {
    setCodigoProducto('');
    setSeleccionados([]);
    setDatos({});
    setMensaje('');
    setTitulo('Tendencia de Existencias Totales');
    setComparar(false);
    setSugerencias([]);
    setActiveIndex(-1);
    setShowSugerencias(false);
    const datosGenerales = await fetchDatos();
    setDatos({ TOTAL: datosGenerales });
  };

  const buscarSugerencias = async (q: string) => {
    const res = await fetch(`/api/refacciones/codigos?q=${q}`);
    const data = await res.json();
    setTodosCodigos(data);
    const filtrados = data.filter((s: Sugerencia) => s.codigo.includes(q));
    setSugerencias(filtrados.slice(0, 20));
  };

  useEffect(() => {
    limpiarFiltro();
  }, []);

  useEffect(() => {
    actualizarGrafica();
  }, [datos]);

  const manejarTeclas = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setActiveIndex((prev) => Math.min(prev + 1, sugerencias.length - 1));
    } else if (e.key === 'ArrowUp') {
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      const codigo = sugerencias[activeIndex].codigo;
      setCodigoProducto(codigo);
      aplicarFiltro(codigo);
      setSugerencias([]);
      setShowSugerencias(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Gráfica por Código de Producto</h1>

      <div className="flex flex-col items-center gap-2 mb-6 relative">
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="text"
            placeholder="Ej: 21510439"
            value={codigoProducto}
            onFocus={() => {
              setShowSugerencias(true);
              buscarSugerencias('');
            }}
            onChange={(e) => {
              setCodigoProducto(e.target.value);
              buscarSugerencias(e.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={manejarTeclas}
            className="bg-white text-black border border-gray-400 px-4 py-2 rounded w-72 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => aplicarFiltro(codigoProducto)}
            className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-md"
          >
            Buscar Código
          </button>
          <button
            onClick={limpiarFiltro}
            className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded shadow-md"
          >
            Limpiar Filtro
          </button>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={comparar}
              onChange={() => setComparar(!comparar)}
            />
            Comparar
          </label>
        </div>

        {showSugerencias && sugerencias.length > 0 && (
          <ul className="absolute top-14 z-10 bg-white text-black w-72 max-h-48 overflow-y-auto border border-gray-300 rounded shadow">
            {sugerencias.map((s, i) => (
              <li
                key={i}
                onClick={() => {
                  setCodigoProducto(s.codigo);
                  aplicarFiltro(s.codigo);
                  setSugerencias([]);
                  setShowSugerencias(false);
                  setActiveIndex(-1);
                }}
                className={`px-4 py-2 cursor-pointer hover:bg-blue-100 ${activeIndex === i ? 'bg-blue-100' : ''}`}
              >
                {s.codigo} - {s.descripcion}
              </li>
            ))}
          </ul>
        )}
      </div>

      {seleccionados.length > 0 && comparar && (
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {seleccionados.map((c) => (
            <span key={c} className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm">
              {c}
            </span>
          ))}
        </div>
      )}

      {mensaje && (
        <div className="text-center text-red-600 font-semibold mb-4">
          {mensaje}
        </div>
      )}

      <div ref={chartRef} className="w-full h-[400px] mb-8" />

      <div className="flex justify-center">
        <button
          onClick={() => router.push('/dashboard_refacciones')}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          ⬅️ Volver al Dashboard
        </button>
      </div>
    </div>
  );
}
