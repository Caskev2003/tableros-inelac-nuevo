"use client";

import { useState } from "react";
import { toast } from "@/hooks/use-toast";

// shadcn/ui
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type MovTipo = "ENTRADA" | "SALIDA" | "NUEVO_INGRESO" | "EDITADO" | "ELIMINADO";
type AlmacenEnum = "REFACCIONES" | "QUIMICOS";

type Movimiento = {
  id: number;
  codigo: number;
  descripcion: string;
  noParte: string;
  movimiento: MovTipo;
  cantidad: number;
  existenciaFisicaDespues: number;
  fechaMovimiento: string;
  reportadoPorId: number;
  usuarioReportado?: { nombre?: string };

  // Campos de tu Prisma
  almacenEnum?: AlmacenEnum | null;  // @map("almacen_enum")
  almacenText?: string | null;       // @map("almacen")

  // Derivado para la UI/Excel
  almacenLabel?: string;
};

interface ExportHistorialModalProps {
  open: boolean;
  onClose: () => void;
}

/* -------------------------- utilidades de formato -------------------------- */
function formatStamp(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${yyyy}-${MM}-${dd}_${hh}-${mm}`;
}

function mapAlmacenLabel(m: Pick<Movimiento, "almacenEnum" | "almacenText">): string {
  if (m.almacenEnum === "REFACCIONES") return "Almacén de Refacciones";
  if (m.almacenEnum === "QUIMICOS") return "Almacén de Químicos";
  const txt = (m.almacenText ?? "").trim();
  if (/quim/i.test(txt)) return "Almacén de Químicos";
  if (/refac/i.test(txt)) return "Almacén de Refacciones";
  return txt || "—";
}

/** Fila mostrada en el Excel (mismas columnas que tu tabla del front) */
function buildRow(item: Movimiento) {
  return {
    Código: item.codigo,
    Descripción: item.descripcion,
    "No. Parte": item.noParte,
    Movimiento: item.movimiento,
    Cantidad: item.cantidad,
    "Stock actual": item.existenciaFisicaDespues,
    Almacén: item.almacenLabel ?? mapAlmacenLabel(item),
    "Realizado por": item.usuarioReportado?.nombre ?? `ID ${item.reportadoPorId}`,
    Fecha: new Date(item.fechaMovimiento).toLocaleString(),
  };
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------ exportar excel ----------------------------- */
async function exportManyXLSX(items: Movimiento[], filenameBase: string) {
  if (!items.length) {
    toast({ title: "Sin resultados", description: "No hay datos en el rango seleccionado." });
    return;
  }
  try {
    const ExcelJS = await import("exceljs");

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Historial");

    const rows = items.map(buildRow);
    const headers = Object.keys(rows[0]);

    // Cabecera estilizada
    ws.addRow(headers);
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFEEEEEE" } },
        left: { style: "thin", color: { argb: "FFEEEEEE" } },
        bottom: { style: "thin", color: { argb: "FFEEEEEE" } },
        right: { style: "thin", color: { argb: "FFEEEEEE" } },
      };
    });

    // Filas + zebra
    rows.forEach((r) => ws.addRow(headers.map((h) => (r as any)[h])));
    for (let i = 2; i <= ws.rowCount; i++) {
      if (i % 2 === 0) {
        ws.getRow(i).eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF6F7F9" } };
        });
      }
    }

    // Freeze header
    ws.views = [{ state: "frozen", ySplit: 1 }];

    // Auto-ancho
    for (let c = 1; c <= headers.length; c++) {
      let max = headers[c - 1].length;
      for (let r = 2; r <= ws.rowCount; r++) {
        const value = String(ws.getRow(r).getCell(c).value ?? "");
        max = Math.max(max, value.length);
      }
      ws.getColumn(c).width = Math.min(Math.max(max + 2, 10), 50);
    }

    // Bordes finos
    for (let r = 1; r <= ws.rowCount; r++) {
      ws.getRow(r).eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        };
      });
    }

    const buffer = await wb.xlsx.writeBuffer();
    downloadBlob(
      `${filenameBase}.xlsx`,
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    );
    toast({ title: "Excel generado", description: "Se descargó el archivo correctamente." });
  } catch (e) {
    console.error(e);
    toast({
      title: "No se pudo generar el Excel",
      description: "Instala 'exceljs' (npm i exceljs).",
      variant: "destructive",
    });
  }
}

/* ---------------------------------- modal --------------------------------- */
export default function ExportHistorialModal({ open, onClose }: ExportHistorialModalProps) {
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Movimiento[]>([]);

  const fetchRango = async () => {
    if (!start || !end) {
      toast({ title: "Rango requerido", description: "Selecciona fecha inicio y fin.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Debe devolver { items: Movimiento[], count?: number } con los campos de Prisma
      const res = await fetch(`/api/refacciones/historial-reporte?start=${start}&end=${end}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      // Normalizamos almacenLabel para cada item
      const normalizados: Movimiento[] = (data.items ?? []).map((it: Movimiento) => ({
        ...it,
        almacenLabel: mapAlmacenLabel(it),
      }));

      setItems(normalizados);
      toast({
        title: "Datos cargados",
        description: `Se encontraron ${data.count ?? normalizados.length} movimientos en el rango.`,
      });
    } catch (e: any) {
      toast({
        title: "Error al cargar",
        description: e?.message ?? "No se pudieron obtener los datos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filenameBase = `Historial-movimiento-${formatStamp(new Date())}`;

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="sm:max-w-lg bg-[#2b2b2b] text-white dark:bg-zinc-900 dark:text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-xl">Exportar historial por rango</DialogTitle>
          <DialogDescription className="text-sm text-gray-400 dark:text-zinc-300">
            Elige la <b>fecha inicio</b> y <b>fecha fin</b>. Primero carga los datos y después exporta a Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Fecha inicio</label>
              <input
                type="date"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:bg-zinc-800 dark:border-zinc-700 text-black" 
                value={start}
                onChange={(e) => setStart(e.target.value)}
                max={end || undefined}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Fecha fin</label>
              <input
                type="date"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:bg-zinc-800 dark:border-zinc-700 text-black"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                min={start || undefined}
              />
            </div>
          </div>

          <div className="text-xs text-gray-400 dark:text-zinc-400">
            Nombre de archivo: <b>{filenameBase}.xlsx</b>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              disabled={loading}
              onClick={fetchRango}
              className="bg-zinc-200 text-black hover:bg-zinc-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
            >
              {loading ? "Cargando..." : "Cargar rango"}
            </Button>

            <Button
              disabled={loading || items.length === 0}
              onClick={() => exportManyXLSX(items, filenameBase)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Exportar Excel
            </Button>
          </div>

          <div className="text-xs text-gray-400 dark:text-zinc-300">
            {items.length > 0
              ? `Registros listos para exportar: ${items.length}`
              : "Aún no hay datos cargados para exportar."}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="bg-white text-zinc-900 hover:bg-zinc-100 border border-zinc-300 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
