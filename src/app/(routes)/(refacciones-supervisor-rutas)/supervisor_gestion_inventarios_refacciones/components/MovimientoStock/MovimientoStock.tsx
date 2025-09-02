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

interface Refaccion {
  codigo: number;
  descripcion: string;
  noParte: string;
  existenciaFisica: number;
  existenciaSistema: number;
  diferencias: number;
  movimiento: Movimiento;
  ubicacion?: {
    rack: number;
    posicion: string;
  };
}

interface Props {
  onSuccess?: () => void;
}

export default function MovimientoStockRefacciones({ onSuccess }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [noParte, setNoParte] = useState("");
  const [stock, setStock] = useState("");
  const [refaccion, setRefaccion] = useState<Refaccion | null>(null);
  const [loading, setLoading] = useState(false);

  const buscarPorCodigo = async () => {
    if (!codigo.trim()) {
      toast({
        title: "Error",
        description: "Ingrese un código válido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/refacciones/buscar-entrada-salida?codigo=${codigo}`);
      if (!res.ok) throw new Error("Refacción no encontrada");
      
      const data = await res.json();
      if (!data) throw new Error();
      
      setRefaccion(data);
    } catch (error) {
      toast({ 
        title: "No encontrado", 
        description: "Código no válido", 
        variant: "destructive" 
      });
      setRefaccion(null);
    } finally {
      setLoading(false);
    }
  };

  const buscarPorNoParte = async () => {
    if (!noParte.trim()) {
      toast({
        title: "Error",
        description: "Ingrese un número de parte válido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/refacciones/buscar-entrada-salida?noParte=${noParte}`);
      if (!res.ok) throw new Error("Refacción no encontrada");
      
      const data = await res.json();
      if (!data) throw new Error();
      
      setRefaccion(data);
    } catch (error) {
      toast({ 
        title: "No encontrado", 
        description: "Número de parte no válido", 
        variant: "destructive" 
      });
      setRefaccion(null);
    } finally {
      setLoading(false);
    }
  };

  const actualizarStock = async (tipoMovimiento: "ENTRADA" | "SALIDA") => {
    if (!refaccion) return;
    
    const cantidad = parseInt(stock);
    if (isNaN(cantidad)) {
      toast({ 
        title: "Error", 
        description: "Ingrese una cantidad válida", 
        variant: "destructive" 
      });
      return;
    }

    if (cantidad <= 0) {
      toast({ 
        title: "Error", 
        description: "La cantidad debe ser mayor a cero", 
        variant: "destructive" 
      });
      return;
    }

    if (tipoMovimiento === "SALIDA" && refaccion.existenciaFisica < cantidad) {
      toast({
        title: "Error",
        description: "No hay suficiente existencia física",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/refacciones/movimiento/${refaccion.codigo}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: tipoMovimiento,
          cantidad,
          nuevaExistencia: tipoMovimiento === "ENTRADA" 
            ? refaccion.existenciaFisica + cantidad 
            : refaccion.existenciaFisica - cantidad,
          nuevasDiferencias: tipoMovimiento === "ENTRADA"
            ? Math.abs((refaccion.existenciaFisica + cantidad) - refaccion.existenciaSistema)
            : Math.abs((refaccion.existenciaFisica - cantidad) - refaccion.existenciaSistema),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al actualizar");
      }

      toast({
        title: tipoMovimiento === "ENTRADA" ? "✅ Entrada registrada" : "✅ Salida registrada",
        description: `Stock actualizado correctamente (${cantidad} ${tipoMovimiento.toLowerCase()})`,
      });

      // Resetear el formulario
      setRefaccion(null);
      setCodigo("");
      setNoParte("");
      setStock("");
      setOpen(false);
      
      // Actualizar la vista
      router.refresh();
      onSuccess?.();
    } catch (error: any) {
      toast({ 
        title: "❌ Error", 
        description: error.message || "No se pudo actualizar el stock", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="text-white">
          Entrada / Salida
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-[#2b2b2b] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Entrada/Salida de Refacciones</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Buscar por código" 
              value={codigo} 
              onChange={(e) => setCodigo(e.target.value)}
              className="bg-white text-black"
              disabled={loading}
            />
            <Button 
              onClick={buscarPorCodigo} 
              className="bg-[#426689] hover:bg-[#567798] text-white"
              disabled={loading || !codigo.trim()}
            >
              Buscar
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Input 
              placeholder="Buscar por Nº Parte" 
              value={noParte} 
              onChange={(e) => setNoParte(e.target.value)}
              className="bg-white text-black"
              disabled={loading}
            />
            <Button 
              onClick={buscarPorNoParte} 
              className="bg-[#426689] hover:bg-[#567798] text-white"
              disabled={loading || !noParte.trim()}
            >
              Buscar
            </Button>
          </div>

          {loading && (
            <div className="text-center py-4">
              <p>Cargando...</p>
            </div>
          )}

          {refaccion && !loading && (
            <div className="bg-[#424242] p-4 rounded-md space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <p><strong>Código:</strong> {refaccion.codigo}</p>
                <p><strong>No. Parte:</strong> {refaccion.noParte}</p>
                <p><strong>Descripción:</strong> {refaccion.descripcion}</p>
                <p><strong>Ubicación:</strong> {refaccion.ubicacion ? `Rack ${refaccion.ubicacion.rack}, Pos ${refaccion.ubicacion.posicion}` : 'N/A'}</p>
                <p><strong>Existencia física:</strong> {refaccion.existenciaFisica}</p>
                <p><strong>Existencia sistema:</strong> {refaccion.existenciaSistema}</p>
                <p><strong>Diferencias:</strong> {refaccion.diferencias}</p>
              </div>

              <div className="pt-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={stock}
                    onChange={(e) => setStock(e.target.value.replace(/\D/g, ''))}
                    placeholder="Cantidad"
                    className="w-40 bg-white text-black"
                    disabled={loading}
                  />
                  <Button 
                    onClick={() => actualizarStock("ENTRADA")} 
                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                    disabled={loading || !stock || parseInt(stock) <= 0}
                  >
                    {loading ? "Procesando..." : "Entrada"}
                  </Button>
                  <Button 
                    onClick={() => actualizarStock("SALIDA")} 
                    className="bg-red-600 hover:bg-red-700 text-white flex-1"
                    disabled={loading || !stock || parseInt(stock) <= 0 || parseInt(stock) > refaccion.existenciaFisica}
                  >
                    {loading ? "Procesando..." : "Salida"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}