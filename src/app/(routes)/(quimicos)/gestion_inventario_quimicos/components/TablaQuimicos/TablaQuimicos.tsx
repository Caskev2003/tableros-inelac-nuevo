"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { toast } from "@/hooks/use-toast"
import { Trash2 } from "lucide-react"
import { Quimico } from "./TablaQuimicos.types"
import { ModalEditarQuimico } from "../ModalEditarQuimico"
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

// Componente para el semáforo de existencias
const SemaforoExistencia = ({ valor }: { valor: number }) => {
  return (
    <div className={`
      inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
      ${valor <= 0 
        ? 'bg-red-500 text-white border border-red-700 shadow-sm' 
        : valor < 5 
          ? 'bg-yellow-400 text-gray-900 border border-yellow-600 shadow-sm' 
          : 'bg-green-500 text-white border border-green-700 shadow-sm'
      }`}
    >
      <span className="font-bold text-sm mr-1.5">{valor}</span>
      {valor <= 0 ? 'Agotado' : valor < 5 ? 'Bajo' : 'Disponible'}
    </div>
  )
}

// Componente para el indicador de caducidad
const IndicadorCaducidad = ({ fechaVencimiento }: { fechaVencimiento: Date | string }) => {
  const calcularDias = () => {
    const fechaVenc = new Date(fechaVencimiento)
    const hoy = new Date()
    fechaVenc.setHours(0, 0, 0, 0)
    hoy.setHours(0, 0, 0, 0)
    const diffMs = fechaVenc.getTime() - hoy.getTime()
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  }

  const dias = calcularDias()
  const esCaducado = dias <= 0
  const porVencer = dias > 0 && dias <= 60

  return (
    <span className={`
      px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap
      ${esCaducado ? 'bg-red-600 text-white' : ''}
      ${porVencer ? 'bg-yellow-400 text-black' : ''}
      ${!esCaducado && !porVencer ? 'bg-green-600 text-white' : ''}
    `}>
      {esCaducado ? `${Math.abs(dias)} días caducado` : ''}
      {porVencer ? `${dias} días por vencer` : ''}
      {!esCaducado && !porVencer ? `${dias} días vigente` : ''}
    </span>
  )
}

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
        cantidadEntrada: q.cantidadEntrada || 0,
        cantidadSalida: q.cantidadSalida || 0,
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

  const eliminarQuimico = async (codigo: number, noLote: string, descripcion: string) => {
    try {
      await axios.delete(`/api/quimicos?codigo=${codigo}&noLote=${encodeURIComponent(noLote)}`)
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
      setUbicaciones(Array.isArray(data) ? data : [])
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
              <th className="p-3 text-left min-w-[120px]">No. Lote</th>
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
              <th className="p-3 text-left">Estado</th>
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
                key={`${item.codigo}-${item.noLote}`}
                className="border-b bg-[#424242] text-white hover:bg-gray-400 hover:text-black transition"
              >
                <td className="p-2">{item.codigo}</td>
                <td className="p-2">{item.descripcion}</td>
                <td className="p-2 whitespace-nowrap">{item.noLote}</td>
                
                {/* Existencias con semáforo */}
                <td className="p-2">
                  <SemaforoExistencia valor={Number(item.existenciaFisica) || 0} />
                </td>
                <td className="p-2">
                  <SemaforoExistencia valor={Number(item.existenciaSistema) || 0} />
                </td>
                
                {/* Diferencias con indicador */}
                <td className="p-2">
                  <span className={`
                    inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${item.diferencias > 0 
                      ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                      : 'bg-gray-100 text-gray-800 border border-gray-300'
                    }`}
                  >
                    {formatValue(item.diferencias, 'number')}
                  </span>
                </td>

                <td className="p-2">{formatValue(item.cantidadEntrada, 'number')}</td>
                <td className="p-2">{formatValue(item.cantidadSalida, 'number')}</td>
                <td className="p-2">{item.unidadMedidaId}</td>
                <td className="p-2">{item.proveedores}</td>
                <td className="p-2">
                  {item.ubicacion ? `Rack ${item.ubicacion.rack}, Pos. ${item.ubicacion.posicion}` : '-'}
                </td>
                <td className="p-2">{formatValue(item.fechaIngreso, 'date')}</td>
                <td className="p-2">{formatValue(item.fechaVencimiento, 'date')}</td>
                <td className="p-2">
                  <IndicadorCaducidad fechaVencimiento={item.fechaVencimiento} />
                </td>
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
                          onClick={() => eliminarQuimico(item.codigo, item.noLote, item.descripcion)}
                          className="bg-red-600 hover:bg-red-800"
                        >
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <ModalEditarQuimico
                    codigo={item.codigo}
                    noLote={item.noLote}
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