"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog"
import { Pencil } from "lucide-react"
import axios from "axios"
import { toast } from "@/hooks/use-toast"
import { EditarQuimico } from "../EditarQuimicos"
import { Unidad_medida } from "@prisma/client"

interface QuimicoData {
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
  codigo: number
  ubicaciones: Array<{
    id: number
    rack: number
    posicion: string
    fila: string
  }>
  onSuccess: () => void
}

export function ModalEditarQuimico({ codigo, ubicaciones, onSuccess }: Props) {
  const [open, setOpen] = useState(false)
  const [quimico, setQuimico] = useState<QuimicoData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchQuimico = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // 1. Verificar que el código sea válido
      if (!codigo || isNaN(Number(codigo))) {
        throw new Error("Código de químico inválido")
      }

      // 2. Hacer la petición al endpoint correcto
      const { data } = await axios.get(`/api/quimicos/update/get`, {
        params: { codigo }
      })

      // 3. Validar la respuesta
      if (!data || !data.success) {
        throw new Error(data?.error || "No se recibieron datos del químico")
      }

      if (!data.data) {
        throw new Error("La estructura de datos es incorrecta")
      }

      // 4. Formatear las fechas para inputs type="date"
      const formatDate = (dateString: string) => {
        try {
          return new Date(dateString).toISOString().split('T')[0]
        } catch {
          return ""
        }
      }

      // 5. Preparar los datos para el formulario
      const quimicoFormateado: QuimicoData = {
        ...data.data,
        fechaIngreso: formatDate(data.data.fechaIngreso),
        fechaVencimiento: formatDate(data.data.fechaVencimiento),
        diasDeVida: data.data.diasDeVida ?? undefined,
        ubicacionId: data.data.ubicacion?.id || data.data.ubicacionId
      }

      setQuimico(quimicoFormateado)
    } catch (err: any) {
      console.error("Error al cargar químico:", err)
      setError(err.message)
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      })
      setOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchQuimico()
    } else {
      setQuimico(null)
      setError(null)
    }
  }, [open])

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
        <h2 className="text-xl font-semibold mb-4">Editar Químico</h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <p>Cargando datos del químico...</p>
            <p className="text-sm text-gray-400">Código: {codigo}</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>Error al cargar el químico</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : quimico ? (
          <EditarQuimico
            quimico={quimico}
            ubicaciones={ubicaciones}
            onSuccess={() => {
              setOpen(false)
              onSuccess()
              toast({
                title: "Éxito",
                description: "Químico actualizado correctamente",
                variant: "default"
              })
            }}
          />
        ) : (
          <div className="text-center py-8">
            No se encontraron datos del químico
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}