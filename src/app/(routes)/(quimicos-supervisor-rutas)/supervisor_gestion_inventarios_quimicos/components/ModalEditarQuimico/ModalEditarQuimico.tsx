"use client"

import { useEffect, useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { EditarQuimico } from "../EditarQuimicos";
import { Unidad_medida } from "@prisma/client";

interface QuimicoData {
  id: number
  codigo: number
  descripcion: string
  noLote: string
  proveedores: string
  fechaIngreso: string
  fechaVencimiento: string
  unidadMedidaId: Unidad_medida
  ubicacionId: number
  existenciaFisica: number
  existenciaSistema: number
  retenidos: number
  productoLiberado: string
  diasDeVida?: number
  reportadoPorId: number
  ubicacion?: {
    id: number
    rack: number
    posicion: string
    fila: string
  }
}

interface Props {
  id?: number // Prop opcional como respaldo
  codigo: number
  noLote: string
  ubicaciones: Array<{
    id: number
    rack: number
    posicion: string
    fila: string
  }>
  onSuccess: () => void
}

export function ModalEditarQuimico({ id, codigo, noLote, ubicaciones, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [quimico, setQuimico] = useState<QuimicoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuimico = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Parámetros de búsqueda:", { id, codigo, noLote });

      // Validación mejorada de parámetros
      if (!id && (!codigo || !noLote)) {
        throw new Error("Se requiere código y número de lote o ID del químico");
      }

      // Prepara parámetros de búsqueda
      const params = id ? { id } : { codigo, noLote: noLote.trim() };

      const { data } = await axios.get("/api/quimicos/update/get", {
        params,
        validateStatus: (status) => status < 500 // Para manejar errores 400/404
      });

      if (!data?.success) {
        throw new Error(data?.error || "No se pudieron obtener los datos del químico");
      }

      if (!data.data) {
        throw new Error(
          id 
            ? `Químico con ID ${id} no encontrado`
            : `Químico no encontrado (Código: ${codigo}, Lote: ${noLote})`
        );
      }

      console.log("Datos recibidos del servidor:", data.data);

      // Función para formatear fechas de manera segura
      const formatDate = (dateString: string): string => {
        if (!dateString) return "";
        try {
          const date = new Date(dateString);
          return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
        } catch (error) {
          console.error("Error formateando fecha:", dateString, error);
          return "";
        }
      };

      const quimicoFormateado: QuimicoData = {
        ...data.data,
        fechaIngreso: formatDate(data.data.fechaIngreso),
        fechaVencimiento: formatDate(data.data.fechaVencimiento),
        ubicacionId: data.data.ubicacion?.id || data.data.ubicacionId || 0
      };

      setQuimico(quimicoFormateado);
    } catch (err: any) {
      console.error("Error al cargar químico:", {
        error: err,
        requestParams: { id, codigo, noLote },
        response: err.response?.data
      });

      const errorMessage = err.response?.data?.error || 
                         err.message || 
                         "Error desconocido al cargar el químico";

      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchQuimico();
    } else {
      setQuimico(null);
      setError(null);
    }
  }, [open, id, codigo, noLote]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
          onClick={() => setOpen(true)}
          aria-label="Editar químico"
        >
          <Pencil size={16} />
        </button>
      </DialogTrigger>

      <DialogContent className="bg-[#2b2b2b] text-white max-w-5xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-2">Editar Químico</h2>
        
        {/* Mostrar información de identificación */}
        <div className="text-sm text-gray-400 mb-4">
          {id && <p>ID: {id}</p>}
          <p>Código: {codigo}</p>
          {noLote && <p>Lote: {noLote}</p>}
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p>Cargando datos del químico...</p>
            <div className="animate-pulse mt-2">
              <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 text-lg mb-2">{error}</p>
            <div className="mt-4 flex justify-center gap-4">
              <button 
                onClick={fetchQuimico}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Reintentar
              </button>
              <button 
                onClick={() => setOpen(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : quimico ? (
          <EditarQuimico
            quimico={quimico}
            ubicaciones={ubicaciones}
            onSuccess={() => {
              setOpen(false);
              onSuccess();
              toast({
                title: "Éxito",
                description: "Químico actualizado correctamente",
                variant: "default"
              });
            }}
          />
        ) : (
          <div className="text-center py-8">
            <p>No se encontraron datos del químico</p>
            <div className="mt-4 flex justify-center gap-4">
              <button 
                onClick={fetchQuimico}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Intentar nuevamente
              </button>
              <button 
                onClick={() => setOpen(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}