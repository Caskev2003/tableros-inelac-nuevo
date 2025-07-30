'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from "recharts";
import { Dialog } from "@headlessui/react";

interface ComparacionFutura {
  mes: string;
  valor_actual: number;
  valor_predicho: number;
  efectividad: number;
}

type Prediccion = {
  meses: string[];
  valores: number[];
  actual: number;
};

export default function PrediccionArima() {
  const router = useRouter();
  const [prediccion, setPrediccion] = useState<Prediccion | null>(null);
  const [comparaciones, setComparaciones] = useState<ComparacionFutura[]>([]);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const obtenerPrediccion = async () => {
      try {
        const res = await fetch("/api/prediccion-arima", { cache: "no-store" });
        const data = await res.json();
        if (data?.valores && data?.meses) {
          const hoy = new Date();
          const mesesTraducidos = data.meses.map((_: string, i: number) => {
            const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + 1 + i);
            return new Intl.DateTimeFormat("es-ES", {
              month: "long",
              year: "numeric",
            }).format(fecha);
          });
          const comparaciones = data.valores.map((valor: number, i: number) => {
            const efectividad = Math.max(0, 100 - Math.abs(valor - data.actual) / data.actual * 100);
            return {
              mes: mesesTraducidos[i],
              valor_actual: data.actual,
              valor_predicho: parseFloat(valor.toFixed(2)),
              efectividad: parseFloat(efectividad.toFixed(2)),
            };
          });

          setPrediccion({ ...data, meses: mesesTraducidos });
          setComparaciones(comparaciones);
          setSeleccionados(mesesTraducidos);
        }
      } catch (error) {
        console.error("Error al obtener la predicción:", error);
      } finally {
        setLoading(false);
      }
    };

    obtenerPrediccion();
  }, []);

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-white">Cargando predicción...</div>;
  }

  if (!prediccion || !prediccion.meses.length) {
    return <div className="h-screen flex items-center justify-center text-red-500">No hay datos suficientes para predecir.</div>;
  }

  const primerSeleccionadoIndex = prediccion.meses.findIndex((mes) =>
    seleccionados.includes(mes)
  );

  const dataGrafica = [
    {
      mes: "Actual",
      valor: parseFloat(prediccion.actual.toFixed(2)),
      tendencia: "🔵 Valor actual",
      label: "Valor actual",
    },
    ...prediccion.meses
      .map((mes: string, i: number) =>
        seleccionados.includes(mes) && i >= primerSeleccionadoIndex
          ? {
              mes,
              valor: parseFloat(prediccion.valores[i].toFixed(2)),
              tendencia:
                i === 0
                  ? "Inicio"
                  : prediccion.valores[i] > prediccion.valores[i - 1]
                  ? "⬆ Subida"
                  : prediccion.valores[i] < prediccion.valores[i - 1]
                  ? "⬇ Bajada"
                  : "— Estable",
              label: i === primerSeleccionadoIndex ? "Inicio" : "",
            }
          : null
      )
      .filter(Boolean) as { mes: string; valor: number; tendencia: string; label: string }[],
  ];

  return (
    <div className="p-4 min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="flex justify-between">
        <button
          onClick={() => router.back()}
          className="bg-blue-500 text-white p-2 rounded-lg shadow-md hover:bg-blue-700"
        >
          Regresar
        </button>
        <button
          onClick={() => setMostrarModal(true)}
          className="bg-yellow-500 text-black p-2 rounded-lg shadow-md hover:bg-yellow-600"
        >
          Ver Efectividad
        </button>
      </div>

      <h1 className="text-3xl font-bold my-4 text-cyan-400">
        📊 Predicción de existencias totales
      </h1>

      <div className="flex flex-wrap gap-4 mb-4">
        {prediccion.meses.map((mes: string) => (
          <label key={mes} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={seleccionados.includes(mes)}
              onChange={() =>
                setSeleccionados((prev) =>
                  prev.includes(mes) ? prev.filter((m) => m !== mes) : [...prev, mes]
                )
              }
              className="accent-cyan-500"
            />
            <span className="capitalize">{mes}</span>
          </label>
        ))}
      </div>

      <div className="w-full h-[calc(100vh-120px)]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dataGrafica}
            margin={{ top: 20, right: 50, left: 50, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="4 4" stroke="#444" />
            <XAxis dataKey="mes" stroke="#ccc" tick={{ fill: "#ccc" }} />
            <YAxis
              stroke="#ccc"
              tick={{ fill: "#ccc" }}
              tickCount={6}
              interval={0}
              domain={['auto', 'auto']}
              tickFormatter={(value) => `${Math.round(value)}`}
            />

            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #38bdf8", borderRadius: "8px" }}
              labelStyle={{ color: "#facc15", fontWeight: "bold" }}
              formatter={(value: number, name: string, props) => {
                const tendencia = props.payload?.tendencia || "";
                return [`${value.toFixed(2)} unidades`, `Valor estimado ${tendencia ? `(${tendencia})` : ""}`];
              }}
            />

            <Line
              type="monotone"
              dataKey="valor"
              stroke="#38bdf8"
              strokeWidth={3}
              dot={{ r: 6, stroke: "#0ea5e9", strokeWidth: 2, fill: "#38bdf8" }}
              activeDot={{ r: 8, fill: "#facc15" }}
            />

            <ReferenceDot
              x="Actual"
              y={prediccion.actual}
              r={8}
              fill="#facc15"
              stroke="#fbbf24"
              label={{ value: "📍 Hoy", position: "top", fill: "#facc15", fontWeight: "bold" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <Dialog open={mostrarModal} onClose={() => setMostrarModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white text-black max-w-3xl w-full p-6 rounded-lg shadow-xl overflow-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4">📋 Comparación con el valor actual</h2>
            <table className="w-full border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">Mes</th>
                  <th className="border px-2 py-1">Valor actual</th>
                  <th className="border px-2 py-1">Valor predicho</th>
                  <th className="border px-2 py-1">Cercanía (%)</th>
                </tr>
              </thead>
              <tbody>
                {comparaciones.map((item) => (
                  <tr key={item.mes}>
                    <td className="border px-2 py-1 capitalize">{item.mes}</td>
                    <td className="border px-2 py-1">{item.valor_actual}</td>
                    <td className="border px-2 py-1">{item.valor_predicho}</td>
                    <td className="border px-2 py-1">{item.efectividad} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-right">
              <button
                onClick={() => setMostrarModal(false)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
