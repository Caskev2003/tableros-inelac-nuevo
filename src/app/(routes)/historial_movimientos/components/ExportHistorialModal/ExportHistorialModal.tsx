"use client";

import { useState } from "react";
import { toast } from "@/hooks/use-toast";

/** Ajusta si usas shadcn Dialog (recomendado) */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Movimiento = {
  id: number;
  codigoRefaccion: number;
  descripcion: string;
  noParte: string;
  movimiento: "ENTRADA" | "SALIDA" | "NUEVO_INGRESO";
  cantidad: number;
  existenciaFisicaDespues: number;
  fechaMovimiento: string;
  usuarioReportado?: { nombre?: string };
  reportadoPorId: number;
};

interface ExportHistorialModalProps {
  open: boolean;
  onClose: () => void;
}

function formatStamp(d = new Date()) {
  // AAAA-MM-DD_HH-mm
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${yyyy}-${MM}-${dd}_${hh}-${mm}`;
}

function buildRow(item: Movimiento) {
  return {
    Código: item.codigoRefaccion,
    Descripción: item.descripcion,
    "No. Parte": item.noParte,
    Movimiento: item.movimiento,
    "Cantidad ingresada": item.cantidad,
    "Stock actual": item.existenciaFisicaDespues,
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

function exportManyCSV(items: Movimiento[], filenameBase: string) {
  const rows = items.map(buildRow);
  if (rows.length === 0) {
    toast({ title: "Sin resultados", description: "No hay datos en el rango seleccionado." });
    return;
  }
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = (r as any)[h] ?? "";
          const s = String(v).replace(/"/g, '""');
          return /[",\n]/.test(s) ? `"${s}"` : s;
        })
        .join(",")
    ),
  ];
  const csv = lines.join("\n") + "\n";
  downloadBlob(`${filenameBase}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8" }));
}

async function exportManyXLSX(items: Movimiento[], filenameBase: string) {
  if (!items.length) {
    toast({ title: "Sin resultados", description: "No hay datos en el rango seleccionado." });
    return;
  }
  try {
    const XLSX = await import("xlsx");
    const rows = items.map(buildRow);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    downloadBlob(`${filenameBase}.xlsx`, new Blob([wbout], { type: "application/octet-stream" }));
  } catch (e) {
    toast({
      title: "Falta dependencia",
      description: "Instala 'xlsx' (npm i xlsx) para exportar a Excel.",
      variant: "destructive",
    });
  }
}

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
      const url = `/api/refacciones/historial-reporte?start=${start}&end=${end}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setItems(data.items as Movimiento[]);
      toast({
        title: "Datos cargados",
        description: `Se encontraron ${data.count} movimientos en el rango.`,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar historial por rango</DialogTitle>
          <DialogDescription>
            Elige la <b>fecha inicio</b> y <b>fecha fin</b>. Puedes previsualizar (cargar) y luego exportar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Fecha inicio</label>
              <input
                type="date"
                className="w-full rounded border px-3 py-2"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                max={end || undefined}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Fecha fin</label>
              <input
                type="date"
                className="w-full rounded border px-3 py-2"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                min={start || undefined}
              />
            </div>
          </div>

          <div className="text-xs text-gray-600">
            Nombre de archivo: <b>{filenameBase}.(csv/xlsx)</b>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              disabled={loading}
              onClick={fetchRango}
              className="bg-zinc-200 text-black hover:bg-zinc-300"
            >
              {loading ? "Cargando..." : "Cargar rango"}
            </Button>

            <Button
              disabled={loading || items.length === 0}
              onClick={() => exportManyCSV(items, filenameBase)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Exportar CSV
            </Button>

            <Button
              disabled={loading || items.length === 0}
              onClick={() => exportManyXLSX(items, filenameBase)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Exportar XLSX
            </Button>
          </div>

          <div className="text-xs text-gray-700">
            {items.length > 0
              ? `Registros listos para exportar: ${items.length}`
              : "Aún no hay datos cargados para exportar."}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
