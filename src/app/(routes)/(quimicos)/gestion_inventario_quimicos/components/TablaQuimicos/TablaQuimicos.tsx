"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { toast } from "@/hooks/use-toast"
import { Trash2, Pencil } from "lucide-react"
import { Quimico } from "./TablaQuimicos.types"
import { ModalEditarQuimico } from "../ModalEditarQuimico"
import { Movimiento, Unidad_medida } from "@prisma/client"
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
} from "@/components/ui/alert-dialog"

interface Props {
  refrescar?: number
  datosFiltradosCodigo?: Quimico[] | null
  datosFiltradosNoLote?: Quimico[] | null
  busquedaCodigo: string
  busquedaNoLote: string
}

export function TablaQuimicos({
  refrescar = 0,
  datosFiltradosCodigo = null,
  datosFiltradosNoLote = null,
  busquedaCodigo,
  busquedaNoLote,
}: Props) {
  const [quimicos, setQuimicos] = useState<Quimico[]>([])
  const [quimicoSeleccionado, setQuimicoSeleccionado] = useState<Pick<Quimico, "codigo" | "descripcion"> | null>(null)
  const [ubicaciones, setUbicaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchQuimicos = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get<Quimico[]>("/api/quimicos")
      setQuimicos(data.map(q => ({
        ...q,
        fechaIngreso: typeof q.fechaIngreso === 'string' ? q.fechaIngreso : q.fechaIngreso.toISOString(),
        fechaVencimiento: typeof q.fechaVencimiento === 'string' ? q.fechaVencimiento : q.fechaVencimiento.toISOString(),
        diasDeVida: q.diasDeVida || 0,
        cantidadEntrada: q.cantidadEntrada || 0,
        cantidadSalida: q.cantidadSalida || 0,
        entrada: q.cantidadEntrada || 0,
        salida: q.cantidadSalida || 0
      })))
    } catch (error) {
      toast({
        title: "Error al cargar químicos",
        description: "No se pudieron obtener los datos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const eliminarQuimico = async (codigo: number, descripcion: string) => {
    try {
      await axios.delete(`/api/quimicos?codigo=${codigo}`)
      toast({
        title: "✅ Químico eliminado",
        description: `"${descripcion}" fue eliminado correctamente.`,
      })
      fetchQuimicos()
    } catch (error: any) {
      toast({
        title: "❌ Error al eliminar",
        description: error.response?.data?.error || "No se pudo completar la acción.",
        variant: "destructive",
      })
    }
  }

  const cargarUbicaciones = async () => {
    try {
      const { data } = await axios.get("/api/ubicaciones")
      setUbicaciones(data)
    } catch (error) {
      console.error("Error al cargar ubicaciones:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las ubicaciones",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchQuimicos()
    cargarUbicaciones()
  }, [])

  useEffect(() => {
    if (refrescar !== 0) fetchQuimicos()
  }, [refrescar])

  // Datos a mostrar con filtros
  const datosAMostrar = 
    (busquedaCodigo.trim() && datosFiltradosCodigo) ? datosFiltradosCodigo :
    (busquedaNoLote.trim() && datosFiltradosNoLote) ? datosFiltradosNoLote :
    quimicos

  const noHayResultados = (
    (busquedaCodigo.trim() && datosFiltradosCodigo?.length === 0) ||
    (busquedaNoLote.trim() && datosFiltradosNoLote?.length === 0)
  )

  const formatValue = (value: any, type?: 'date' | 'number') => {
    if (value == null) return '-'
    if (type === 'date') return new Date(value).toLocaleDateString()
    if (type === 'number') return Number(value).toLocaleString()
    return String(value)
  }

  return (
    <div className="overflow-x-auto mt-6">
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto rounded-lg shadow">
        <table className="min-w-full text-sm border-collapse bg-white">
          <thead className="bg-[#1e3a5f] text-white sticky top-0 z-10">
            <tr>
              <th className="p-3 text-left">Código</th>
              <th className="p-3 text-left">Descripción</th>
              <th className="p-3 text-left">No. Lote</th>
              <th className="p-3 text-left">Exist. Fís.</th>
              <th className="p-3 text-left">Exist. Sist.</th>
              <th className="p-3 text-left">Diferencias</th>
              <th className="p-3 text-left">Entrada</th>
              <th className="p-3 text-left">Salida</th>
              <th className="p-3 text-left">Unidad</th>
              <th className="p-3 text-left">Proveedor</th>
              <th className="p-3 text-left">Ubicación</th>
              <th className="p-3 text-left">Ingreso</th>
              <th className="p-3 text-left">Vencimiento</th>
              <th className="p-3 text-left">Días de Vida</th>
              <th className="p-3 text-left">Retenidos</th>
              <th className="p-3 text-left">Liberado</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={17} className="text-center py-4 text-white bg-[#424242]">
                  Cargando datos...
                </td>
              </tr>
            )}

            {!loading && noHayResultados && (
              <tr>
                <td colSpan={17} className="text-center py-4 text-red-500 bg-[#424242] font-semibold">
                  No se encontraron químicos con {busquedaCodigo ? `código: ${busquedaCodigo}` : `lote: ${busquedaNoLote}`}
                </td>
              </tr>
            )}

            {!loading && datosAMostrar.map((item) => (
              <tr
                key={item.codigo}
                className="border-b bg-[#424242] text-white hover:bg-gray-400 hover:text-black transition"
              >
                <td className="p-2">{item.codigo}</td>
                <td className="p-2">{item.descripcion}</td>
                <td className="p-2">{item.noLote}</td>
                <td className="p-2">{formatValue(item.existenciaFisica, 'number')}</td>
                <td className="p-2">{formatValue(item.existenciaSistema, 'number')}</td>
                <td className="p-2">{formatValue(item.diferencias, 'number')}</td>
                <td className="p-2">{formatValue(item.cantidadEntrada, 'number')}</td>
                <td className="p-2">{formatValue(item.cantidadSalida, 'number')}</td>
                <td className="p-2">{item.unidadMedidaId}</td>
                <td className="p-2">{item.proveedores}</td>
                <td className="p-2">
                  {item.ubicacion ? `Rack ${item.ubicacion.rack}, Pos. ${item.ubicacion.posicion}` : '-'}
                </td>
                <td className="p-2">{formatValue(item.fechaIngreso, 'date')}</td>
                <td className="p-2">{formatValue(item.fechaVencimiento, 'date')}</td>
                <td className="p-2">{formatValue(item.diasDeVida, 'number')}</td>
                <td className="p-2">{formatValue(item.retenidos, 'number')}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    item.productoLiberado === 'SI' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-red-600 text-white'
                  }`}>
                    {item.productoLiberado || 'NO'}
                  </span>
                </td>
                <td className="p-2 text-center flex justify-center gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        onClick={() => setQuimicoSeleccionado({ 
                          codigo: item.codigo, 
                          descripcion: item.descripcion 
                        })}
                        className="bg-gradient-to-b from-[#c62828] to-[#9d4245] text-white px-3 py-1 rounded-[5px] hover:bg-red-700 transition"
                        aria-label="Eliminar químico"
                      >
                        <Trash2 size={18} />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#2b2b2b] text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar químico?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300">
                          <strong className="block text-white">{item.descripcion}</strong>
                          <span className="text-red-400">Esta acción no se puede deshacer.</span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="hover:bg-gray-600">
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => eliminarQuimico(item.codigo, item.descripcion)}
                          className="bg-red-600 hover:bg-red-800"
                        >
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <ModalEditarQuimico
                    codigo={item.codigo}
                    ubicaciones={ubicaciones}
                    onSuccess={fetchQuimicos}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}