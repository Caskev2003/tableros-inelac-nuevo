"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Movimiento } from "@prisma/client";

interface Quimico {
  codigo: number;
  descripcion: string;
  noLote: string;
  existenciaFisica: number;
  existenciaSistema: number;
  diferencias: number;
  movimiento: Movimiento;
  fechaVencimiento: string;
}

interface Props {
  onSuccess?: () => void;
  tipo?: "QUIMICO" | "REFACCION"; // Nuevo prop para manejar ambos tipos
}

export default function MovimientoStock({ onSuccess, tipo = "QUIMICO" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [noLote, setNoLote] = useState("");
  const [stock, setStock] = useState("");
  const [quimico, setQuimico] = useState<Quimico | null>(null);

  const buscarPorCodigo = async () => {
    if (!codigo) return;
    try {
      const res = await fetch(`/api/quimicos/buscar-movimiento?codigo=${codigo}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setQuimico(data);
    } catch {
      toast({ 
        title: "No encontrado", 
        description: "Código no válido", 
        variant: "destructive" 
      });
      setQuimico(null);
    }
  };

  const buscarPorNoLote = async () => {
    if (!noLote) return;
    try {
      const res = await fetch(`/api/quimicos/buscar-movimiento?noLote=${noLote}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setQuimico(data);
    } catch {
      toast({ 
        title: "No encontrado", 
        description: "Número de lote no válido", 
        variant: "destructive" 
      });
      setQuimico(null);
    }
  };

  const actualizarStock = async (tipoMovimiento: "ENTRADA" | "SALIDA") => {
    if (!quimico) return;
    const cantidad = parseInt(stock);
    
    if (isNaN(cantidad) || cantidad <= 0) {
      toast({ title: "Cantidad inválida", variant: "destructive" });
      return;
    }

    // Validación adicional para químicos (no permitir salida si no hay suficiente)
    if (tipoMovimiento === "SALIDA" && quimico.existenciaFisica < cantidad) {
      toast({
        title: "Error",
        description: "No hay suficiente existencia física",
        variant: "destructive"
      });
      return;
    }

    const nuevaExistencia = tipoMovimiento === "ENTRADA"
      ? quimico.existenciaFisica + cantidad
      : quimico.existenciaFisica - cantidad;

    const nuevasDiferencias = Math.abs(nuevaExistencia - quimico.existenciaSistema);

    try {
      const res = await fetch(`/api/quimicos/movimiento/${quimico.codigo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: tipoMovimiento,
          cantidad,
          nuevaExistencia,
          nuevasDiferencias,
        }),
      });

      if (!res.ok) throw new Error();

      toast({
        title: tipoMovimiento === "ENTRADA" ? "✅ Entrada registrada" : "✅ Salida registrada",
        description: "Stock actualizado correctamente",
      });

      router.refresh();
      onSuccess?.();

      // Limpiar y cerrar
      setQuimico(null);
      setCodigo("");
      setNoLote("");
      setStock("");
      setOpen(false);
    } catch {
      toast({ 
        title: "❌ Error", 
        description: "No se pudo actualizar el stock", 
        variant: "destructive" 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="text-white bg-[#426689] hover:bg-[#3a5a7a]">
          Entrada / Salida
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-[#2b2b2b] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Entrada/Salida de Químicos</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input 
              placeholder="Buscar por código" 
              value={codigo} 
              onChange={(e) => setCodigo(e.target.value)}
              className="bg-white text-black"
            />
            <Button 
              onClick={buscarPorCodigo} 
              className="bg-[#426689] hover:bg-[#567798] text-white"
            >
              Buscar
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Input 
              placeholder="Buscar por Nº Lote" 
              value={noLote} 
              onChange={(e) => setNoLote(e.target.value)}
              className="bg-white text-black"
            />
            <Button 
              onClick={buscarPorNoLote} 
              className="bg-[#426689] hover:bg-[#567798] text-white"
            >
              Buscar
            </Button>
          </div>

          {quimico && (
            <div className="bg-[#424242] p-4 rounded-md space-y-2">
              <p><strong>Código:</strong> {quimico.codigo}</p>
              <p><strong>Descripción:</strong> {quimico.descripcion}</p>
              <p><strong>No. Lote:</strong> {quimico.noLote}</p>
              <p><strong>Existencia física:</strong> {quimico.existenciaFisica}</p>
              <p><strong>Existencia sistema:</strong> {quimico.existenciaSistema}</p>
              <p><strong>Diferencias:</strong> {quimico.diferencias}</p>
              <p><strong>Vencimiento:</strong> {new Date(quimico.fechaVencimiento).toLocaleDateString()}</p>

              <div className="flex items-center gap-2 mt-4">
                <Input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="Cantidad"
                  className="w-40 bg-white text-black"
                />
                <Button 
                  onClick={() => actualizarStock("ENTRADA")} 
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Entrada
                </Button>
                <Button 
                  onClick={() => actualizarStock("SALIDA")} 
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Salida
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}