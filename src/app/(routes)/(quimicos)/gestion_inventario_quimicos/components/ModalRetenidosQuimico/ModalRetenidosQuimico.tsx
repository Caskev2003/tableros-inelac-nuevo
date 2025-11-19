"use client"

import { useState } from "react"
import axios from "axios"
import { toast } from "@/hooks/use-toast"
import { Quimico } from "../TablaQuimicos/TablaQuimicos.types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface Props {
  quimico: Quimico
  onSuccess?: () => void
}

export function ModalRetenidosQuimico({ quimico, onSuccess }: Props) {
  const [open, setOpen] = useState(false)
  const [devolverAStock, setDevolverAStock] = useState<number>(0)
  const [salidaDefinitiva, setSalidaDefinitiva] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  const totalRetenidos = Number(quimico.retenidos || 0)

  const handleSubmit = async () => {
    const dev = Number(devolverAStock) || 0
    const sal = Number(salidaDefinitiva) || 0

    if (dev < 0 || sal < 0) {
      toast({
        title: "Valores inválidos",
        description: "No se permiten valores negativos.",
        variant: "destructive",
      })
      return
    }

    if (dev + sal === 0) {
      toast({
        title: "Nada que procesar",
        description: "Debes procesar al menos una pieza retenida.",
        variant: "destructive",
      })
      return
    }

    if (dev + sal > totalRetenidos) {
      toast({
        title: "Límite excedido",
        description: "La suma no puede superar el total de retenidos.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const res = await axios.patch("/api/quimicos", {
        accion: "procesar-retenidos",
        codigo: quimico.codigo,
        noLote: quimico.noLote,
        devolverAStock: dev,
        salidaDefinitiva: sal,
        reportadoPorId: quimico.reportadoPorId,
      })

      if (res.data?.success) {
        toast({
          title: "Retenidos procesados",
          description: res.data?.message ?? "Se actualizaron las existencias.",
        })
        setOpen(false)
        onSuccess?.()
      } else {
        toast({
          title: "Error",
          description: res.data?.error ?? "No se pudo procesar la operación.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Error al procesar retenidos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (totalRetenidos <= 0) {
    // Si no hay retenidos, no mostramos nada
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="mt-1 text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
        >
          Detalles
        </button>
      </DialogTrigger>
      <DialogContent className="bg-[#2b2b2b] text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Procesar retenidos</DialogTitle>
          <DialogDescription className="text-gray-300">
            Código <strong>{quimico.codigo}</strong> — Lote{" "}
            <strong>{quimico.noLote}</strong>
            <br />
            Retenidos actuales:{" "}
            <strong>{totalRetenidos} {quimico.unidadMedidaId}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-3">
          <div>
            <p className="text-sm mb-1">
              Piezas que <span className="font-semibold">regresan a stock</span> (entrada):
            </p>
            <Input
              type="number"
              value={devolverAStock}
              onChange={(e) => setDevolverAStock(Number(e.target.value) || 0)}
              className="bg-white text-black"
              min={0}
              max={totalRetenidos}
            />
          </div>

          <div>
            <p className="text-sm mb-1">
              Piezas que se dan{" "}
              <span className="font-semibold">salida definitiva</span>:
            </p>
            <Input
              type="number"
              value={salidaDefinitiva}
              onChange={(e) =>
                setSalidaDefinitiva(Number(e.target.value) || 0)
              }
              className="bg-white text-black"
              min={0}
              max={totalRetenidos}
            />
          </div>

          <p className="text-xs text-gray-300">
            La suma de ambos campos no debe superar los{" "}
            <strong>{totalRetenidos}</strong> retenidos actuales. <br />
            Las piezas que regresan a stock se suman a la existencia física. Las
            piezas con salida definitiva se restan de la existencia en sistema.
          </p>
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="bg-gray-500 hover:bg-gray-600 text-white"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? "Guardando..." : "Aplicar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
