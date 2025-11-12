"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Trash2, FileSpreadsheet } from "lucide-react";
import { Refaccion } from "./TablaRefacciones.types";
import { ModalEditarRefaccion } from "../ModalEditarRefaccion";

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
  const [refaccionSeleccionada, setRefaccionSeleccionada] =
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

  const eliminarRefaccion = async (codigo: number, descripcion: string) => {
    try {
      await axios.delete(`/api/refacciones/get?codigo=${codigo}`);
      toast({
        title: "Refacción eliminada",
        description: `La refacción "${descripcion}" fue eliminada correctamente.`,
      });
      fetchRefacciones();
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar la refacción.",
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

  // ======= EXPORTAR A EXCEL (exceljs) =======
  const [exporting, setExporting] = useState(false);

  const exportarExcel = async () => {
    if (!datosAMostrar?.length) return;
    setExporting(true);
    try {
      const ExcelJS = await import("exceljs");

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Refacciones");

      const headers = [
        "Código",
        "Descripción",
        "No. Parte",
        "Exist. Fís.",
        "Exist. Sist.",
        "Diferencias",
        "Unidad",
        "Entrada",
        "Salida",
        "Proveedor",
        "Ubicación",
        "Reportado por",
        "Ingreso",
      ];

      const data = datosAMostrar.map((r) => {
        const ubicacion = r.ubicacion
          ? `Rack ${r.ubicacion.rack ?? ""}, Columna ${r.ubicacion.fila ?? ""}`.trim()
          : "";
        const reportado =
          r.usuarioReportado?.nombre ??
          (r.reportadoPorId ? `ID ${r.reportadoPorId}` : "");
        const ingreso = r.fechaIngreso
          ? new Date(r.fechaIngreso as any).toLocaleDateString()
          : "";

        return [
          r.codigo,
          r.descripcion ?? "",
          r.noParte ?? "",
          Number(r.existenciaFisica ?? 0),
          Number(r.existenciaSistema ?? 0),
          Number(r.diferencias ?? 0),
          r.unidadMedidaId ?? "",
          r.cantidadEntrada ?? "",
          r.cantidadSalida ?? "",
          r.proveedores ?? "",
          ubicacion,
          reportado,
          ingreso,
        ];
      });

      ws.addTable({
        name: "TablaRefacciones",
        ref: "A1",
        headerRow: true,
        totalsRow: false,
        style: { theme: "TableStyleMedium9", showRowStripes: true },
        columns: headers.map((h) => ({ name: h })),
        rows: data,
      });

      ws.views = [{ state: "frozen", ySplit: 1 }];

      // Autowidth
      for (let c = 1; c <= headers.length; c++) {
        let max = headers[c - 1].length;
        for (const row of data) {
          const len = String(row[c - 1] ?? "").length;
          if (len > max) max = len;
        }
        ws.getColumn(c).width = Math.min(Math.max(max + 2, 10), 50);
      }

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const dt = new Date();
      const stamp = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(dt.getDate()).padStart(2, "0")}__${String(
        dt.getHours()
      ).padStart(2, "0")}${String(dt.getMinutes()).padStart(2, "0")}`;
      const name = `Historial-Refacciones-${stamp}.xlsx`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast({
        title: "No se pudo generar el Excel",
        description: "Verifica la instalación de exceljs.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };
  // ==========================================

  return (
    <div className="overflow-x-auto mt-6">
      {/* Toolbar superior con botón de exportación */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold text white">Refacciones</h3>

        <button
          onClick={exportarExcel}
          disabled={exporting || !datosAMostrar.length}
          className={`group inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold shadow-md transition ${
            exporting || !datosAMostrar.length
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-700 text-white hover:brightness-110 active:scale-[0.98]"
          }`}
          title={
            !datosAMostrar.length
              ? "No hay datos para exportar"
              : "Exportar a Excel"
          }
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-white/20 backdrop-blur-sm">
            <FileSpreadsheet className="h-4 w-4" />
          </span>
          {exporting ? "Exportando..." : "Exportar Excel"}
        </button>
      </div>

      {/* Controles de paginación con conteo de registros */}
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
              <th className="p-3 text-center">Acciones</th>
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
                <td className="p-2 text-center flex justify-center gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        onClick={() =>
                          setRefaccionSeleccionada({
                            codigo: item.codigo,
                            descripcion: item.descripcion,
                          })
                        }
                        className="bg-gradient-to-b from-[#c62828] to-[#9d4245] text-white px-3 py-1 rounded-[5px] hover:bg-red-700 transition"
                      >
                        <Trash2 />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Estás a punto de eliminar la refacción{" "}
                          <strong>{refaccionSeleccionada?.descripcion}</strong>.
                          Esta acción no se puede revertir.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="hover:bg-white hover:text-black transition-all">
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            if (refaccionSeleccionada)
                              eliminarRefaccion(
                                refaccionSeleccionada.codigo,
                                refaccionSeleccionada.descripcion
                              );
                          }}
                          className="bg-red-500 hover:bg-red-700"
                        >
                          Sí, eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <ModalEditarRefaccion
                    codigo={item.codigo}
                    ubicaciones={ubicaciones}
                    onSuccess={() => fetchRefacciones()}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
