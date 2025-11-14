"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { Refaccion } from "./TablaRefacciones.types";

interface Props {
  refrescar?: number;
  datosFiltradosCodigo?: Refaccion[] | null;
  datosFiltradosNoParte?: Refaccion[] | null;
  busquedaCodigo: string;
  busquedaNoParte: string;
}

export function TablaRefacciones({
  refrescar = 0,
  datosFiltradosCodigo = null,
  datosFiltradosNoParte = null,
  busquedaCodigo,
  busquedaNoParte,
}: Props) {
  const [refacciones, setRefacciones] = useState<Refaccion[]>([]);
    useState<Pick<Refaccion, "codigo" | "descripcion"> | null>(null);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // <- paginación en 10

  const fetchRefacciones = async () => {
    try {
      const { data } = await axios.get("/api/refacciones/get");
      setRefacciones(data);
    } catch (error) {
      toast({
        title: "Error al cargar refacciones",
        description: "No se pudieron obtener los datos.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchRefacciones();
    axios
      .get("/api/ubicaciones/get")
      .then((res) => setUbicaciones(res.data))
      .catch((err) => console.error("Error al cargar ubicaciones:", err));
  }, []);

  useEffect(() => {
    if (refrescar !== 0) {
      fetchRefacciones();
    }
  }, [refrescar]);

  let datosAMostrar = refacciones;

  if (busquedaCodigo.trim() !== "" && datosFiltradosCodigo) {
    datosAMostrar = datosFiltradosCodigo;
  } else if (busquedaNoParte.trim() !== "" && datosFiltradosNoParte) {
    datosAMostrar = datosFiltradosNoParte;
  }

  // Calcular datos paginados
  const totalPages = Math.max(1, Math.ceil(datosAMostrar.length / itemsPerPage));

  // Clamp si cambia el total para no quedar en página vacía
  useEffect(() => {
    const clamped = Math.max(1, Math.min(currentPage, totalPages));
    if (clamped !== currentPage) setCurrentPage(clamped);
  }, [totalPages, currentPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = datosAMostrar.slice(indexOfFirstItem, indexOfLastItem);

  const noHayResultados =
    (busquedaCodigo.trim() !== "" && datosFiltradosCodigo?.length === 0) ||
    (busquedaNoParte.trim() !== "" && datosFiltradosNoParte?.length === 0);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPage = (page: number) => setCurrentPage(page);

  // -------- Paginación con "…" (ellipsis) --------
  const buildPageList = (
    tp: number,
    cp: number
  ): (number | "ellipsis")[] => {
    if (tp <= 7) {
      return Array.from({ length: tp }, (_, i) => i + 1);
    }
    if (cp <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis", tp];
    }
    if (cp >= tp - 3) {
      return [1, "ellipsis", tp - 4, tp - 3, tp - 2, tp - 1, tp];
    }
    return [1, "ellipsis", cp - 1, cp, cp + 1, "ellipsis", tp];
  };
  const pageList = buildPageList(totalPages, currentPage);
  // ----------------------------------------------

  const SemaforoExistencia = ({ valor }: { valor: number }) => {
    return (
      <div
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          valor <= 0
            ? "bg-red-500 text-white border border-red-700 shadow-sm"
            : valor < 10
            ? "bg-yellow-400 text-gray-900 border border-yellow-600 shadow-sm"
            : "bg-green-500 text-white border border-green-700 shadow-sm"
        }`}
      >
        <span className="font-bold mr-1">{valor}</span>
        {valor <= 0 ? "Sin stock" : valor < 10 ? "Stock Bajo" : "Disponible"}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto mt-6">
      {/* Toolbar superior con botón de exportación */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold text white">Refacciones</h3>
      </div>

      {/* Controles de paginación con conteo de registros*/}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          {/* Etiqueta de conteo de registros */}
          <div className="text-sm font-medium text-blue-600">
            Mostrando registros{" "}
            <span className="font-bold text-blue-800">
              {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, datosAMostrar.length)}
            </span>{" "}
            de <span className="font-bold">{datosAMostrar.length}</span>
          </div>

          {/* Controles de paginación */}
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-blue-600">
              Página <span className="font-bold text-blue-800">{currentPage}</span>{" "}
              de <span className="font-bold">{totalPages}</span>
            </div>

            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-all ${
                currentPage === 1
                  ? "text-gray-500 bg-gray-200 cursor-not-allowed"
                  : "text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md"
              }`}
            >
              ANTERIOR
            </button>

            {/* Números de página con "…" */}
            <div className="flex gap-1 items-center">
              {pageList.map((p, i) =>
                p === "ellipsis" ? (
                  <span key={`el-${i}`} className="px-2 text-blue-600 select-none">
                    …
                  </span>
                ) : (
                  <button
                    key={p as number}
                    onClick={() => goToPage(p as number)}
                    className={`px-3 py-1 text-sm rounded-md font-medium transition-all ${
                      currentPage === p
                        ? "text-white bg-gradient-to-r from-orange-500 to-orange-600 shadow-md transform scale-105"
                        : "text-blue-700 bg-blue-100 hover:bg-blue-200"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-all ${
                currentPage === totalPages
                  ? "text-gray-500 bg-gray-200 cursor-not-allowed"
                  : "text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md"
              }`}
            >
              SIGUIENTE
            </button>
          </div>
        </div>
      )}

      <div className="max-h-[calc(100vh-300px)] overflow-y-auto rounded-lg shadow">
        <table className="min-w-full text-sm border-collapse bg-white">
          <thead className="bg-[#1e3a5f] text-white sticky top-0 z-10">
            <tr>
              <th className="p-3 text-left">Código</th>
              <th className="p-3 text-left">Descripción</th>
              <th className="p-3 text-left">No. Parte</th>
              <th className="p-3 text-left">Exist. Fís.</th>
              <th className="p-3 text-left">Exist. Sist.</th>
              <th className="p-3 text-left">Diferencias</th>
              <th className="p-3 text-left">Unidad</th>
              <th className="p-3 text-left">Entrada</th>
              <th className="p-3 text-left">Salida</th>
              <th className="p-3 text-left">Proveedor</th>
              <th className="p-3 text-left">Ubicación</th>
              <th className="p-3 text-left">Reportado por</th>
              <th className="p-3 text-left">Ingreso</th>
            </tr>
          </thead>
          <tbody>
            {noHayResultados && (
              <tr>
                <td
                  colSpan={16}
                  className="text-center py-4 text-red-500 bg-[#424242] font-semibold"
                >
                  No existe ninguna refacción con el{" "}
                  {busquedaCodigo
                    ? `código: ${busquedaCodigo}`
                    : `número de parte: ${busquedaNoParte}`}
                </td>
              </tr>
            )}

            {currentItems.map((item) => (
              <tr
                key={item.codigo}
                className="border-b bg-[#424242] text-white hover:bg-gray-400 hover:text-black transition"
              >
                <td className="p-2">{item.codigo}</td>
                <td className="p-2">{item.descripcion}</td>
                <td className="p-2 min-w-[150px] max-w-[200px] overflow-hidden text-ellipsis hover:whitespace-normal">
                  {item.noParte}
                </td>
                <td className="p-2">
                  <SemaforoExistencia valor={Number(item.existenciaFisica)} />
                </td>
                <td className="p-2">
                  <SemaforoExistencia valor={Number(item.existenciaSistema)} />
                </td>
                <td className="p-2">
                  <span
                    className={`
                    inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${
                      item.diferencias > 0
                        ? "bg-purple-100 text-purple-800 border border-purple-300"
                        : "bg-gray-100 text-gray-800 border border-gray-300"
                    }`}
                  >
                    {item.diferencias}
                  </span>
                </td>

                <td className="p-2">{item.unidadMedidaId}</td>
                <td className="p-2">{item.cantidadEntrada}</td>
                <td className="p-2">{item.cantidadSalida}</td>
                <td className="p-2">{item.proveedores}</td>
                <td className="p-2">
                  Rack {item.ubicacion?.rack}, Columna {item.ubicacion?.fila}
                </td>
                <td className="p-2">
                  {item.usuarioReportado?.nombre || `ID ${item.reportadoPorId}`}
                </td>
                <td className="p-2">
                  {new Date(item.fechaIngreso).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
