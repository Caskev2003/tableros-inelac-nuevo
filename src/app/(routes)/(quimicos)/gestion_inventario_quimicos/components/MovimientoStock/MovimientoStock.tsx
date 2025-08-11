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
  ubicacion?: {
    rack: number;
    posicion: string;
    fila: string;
  };
}

interface QuimicoOption extends Omit<Quimico, 'fechaVencimiento'> {
  fechaIngreso: string;
  ubicacionTexto: string;
}

interface Props {
  onSuccess?: () => void;
}

export default function MovimientoStock({ onSuccess }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [noLote, setNoLote] = useState("");
  const [stock, setStock] = useState("");
  const [quimico, setQuimico] = useState<Quimico | null>(null);
  const [quimicosOpciones, setQuimicosOpciones] = useState<QuimicoOption[]>([]);
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
      const res = await fetch(`/api/quimicos/buscar-entrada-salida?codigo=${codigo}`);
      if (!res.ok) throw new Error("Error en la búsqueda");
      
      const data = await res.json();
      
      if (data.opciones) {
        // Mostrar opciones al usuario
        setQuimicosOpciones(data.opciones);
        setQuimico(null);
      } else if (data.resultado) {
        // Solo había un resultado
        setQuimico({
          ...data.resultado,
          fechaVencimiento: data.resultado.fechaVencimiento || new Date().toISOString()
        });
        setQuimicosOpciones([]);
      } else {
        throw new Error("No se encontraron resultados");
      }
    } catch (error) {
      toast({ 
        title: "No encontrado", 
        description: "No se encontraron químicos con ese código", 
        variant: "destructive" 
      });
      setQuimico(null);
      setQuimicosOpciones([]);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarQuimico = async (noLoteSeleccionado: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quimicos/buscar-entrada-salida?codigo=${codigo}&noLote=${noLoteSeleccionado}`);
      if (!res.ok) throw new Error("Error al seleccionar");
      
      const data = await res.json();
      
      if (data.resultado) {
        setQuimico({
          ...data.resultado,
          fechaVencimiento: data.resultado.fechaVencimiento || new Date().toISOString()
        });
        setNoLote(data.resultado.noLote);
        setQuimicosOpciones([]);
      } else {
        throw new Error("No se pudo cargar el químico seleccionado");
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "No se pudo cargar el químico", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const buscarPorNoLote = async () => {
    if (!noLote.trim()) {
      toast({
        title: "Error",
        description: "Ingrese un número de lote válido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/quimicos/buscar-entrada-salida?noLote=${noLote}`);
      if (!res.ok) throw new Error("Error en la búsqueda");
      
      const data = await res.json();
      
      if (data.resultado) {
        setQuimico({
          ...data.resultado,
          fechaVencimiento: data.resultado.fechaVencimiento || new Date().toISOString()
        });
        setQuimicosOpciones([]);
      } else {
        throw new Error("No se encontraron resultados");
      }
    } catch (error) {
      toast({ 
        title: "No encontrado", 
        description: "No se encontró químico con ese número de lote", 
        variant: "destructive" 
      });
      setQuimico(null);
    } finally {
      setLoading(false);
    }
  };

  const actualizarStock = async (tipoMovimiento: "ENTRADA" | "SALIDA") => {
    if (!quimico) return;
    
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

    if (tipoMovimiento === "SALIDA" && quimico.existenciaFisica < cantidad) {
      toast({
        title: "Error",
        description: "No hay suficiente existencia física",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/quimicos/movimiento/${quimico.codigo}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: tipoMovimiento,
          cantidad,
          noLote: quimico.noLote,
          nuevaExistencia: tipoMovimiento === "ENTRADA" 
            ? quimico.existenciaFisica + cantidad 
            : quimico.existenciaFisica - cantidad,
          nuevasDiferencias: tipoMovimiento === "ENTRADA"
            ? Math.abs((quimico.existenciaFisica + cantidad) - quimico.existenciaSistema)
            : Math.abs((quimico.existenciaFisica - cantidad) - quimico.existenciaSistema),
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
      setQuimico(null);
      setCodigo("");
      setNoLote("");
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
        <Button className="text-white bg-[#426689] hover:bg-[#3a5a7a]">
          Entrada / Salida
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-[#2b2b2b] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Entrada/Salida de Químicos</DialogTitle>
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
              placeholder="Buscar por Nº Lote" 
              value={noLote} 
              onChange={(e) => setNoLote(e.target.value)}
              className="bg-white text-black"
              disabled={loading}
            />
            <Button 
              onClick={buscarPorNoLote} 
              className="bg-[#426689] hover:bg-[#567798] text-white"
              disabled={loading || !noLote.trim()}
            >
              Buscar
            </Button>
          </div>

          {loading && (
            <div className="text-center py-4">
              <p>Cargando...</p>
            </div>
          )}

          {quimicosOpciones.length > 0 && (
            <div className="bg-[#424242] p-4 rounded-md space-y-3">
              <h3 className="font-medium">Seleccione el producto que busca:</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {quimicosOpciones.map((q) => (
                  <div 
                    key={q.noLote}
                    className="p-3 border border-gray-600 rounded hover:bg-[#555555] cursor-pointer"
                    onClick={() => seleccionarQuimico(q.noLote)}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <p><strong>Lote:</strong> {q.noLote}</p>
                      <p><strong>Existencia:</strong> {q.existenciaFisica}</p>
                      <p><strong>Ubicación:</strong> {q.ubicacionTexto}</p>
                      <p><strong>Ingreso:</strong> {q.fechaIngreso}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {quimico && !loading && (
          <>
            <Button
              variant="outline"
              onClick={() => {
                // Al regresar, borra el químico y limpia el lote, para volver a opciones o búsqueda
                setQuimico(null);
                setNoLote("");
                // Si había opciones, se mantienen para mostrar la lista
                // Si no, solo se resetea el quimico para volver a búsqueda
              }}
                className="mb-4"
            >
              Regresar
            </Button>
            <div className="bg-[#424242] p-4 rounded-md space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <p><strong>Código:</strong> {quimico.codigo}</p>
                <p><strong>No. Lote:</strong> {quimico.noLote}</p>
                <p><strong>Descripción:</strong> {quimico.descripcion}</p>
                <p><strong>Ubicación:</strong> {quimico.ubicacion ? `Rack ${quimico.ubicacion.rack}, Pos ${quimico.ubicacion.posicion}, Fila ${quimico.ubicacion.fila}` : 'N/A'}</p>
                <p><strong>Existencia física:</strong> {quimico.existenciaFisica}</p>
                <p><strong>Existencia sistema:</strong> {quimico.existenciaSistema}</p>
                <p><strong>Diferencias:</strong> {quimico.diferencias}</p>
                <p><strong>Vencimiento:</strong> {new Date(quimico.fechaVencimiento).toLocaleDateString()}</p>
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
                    disabled={loading || !stock || parseInt(stock) <= 0 || parseInt(stock) > quimico.existenciaFisica}
                  >
                    {loading ? "Procesando..." : "Salida"}
                  </Button>
                </div>
              </div>
            </div>
          </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}