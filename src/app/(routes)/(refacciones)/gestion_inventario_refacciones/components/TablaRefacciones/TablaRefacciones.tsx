"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { toast } from "@/hooks/use-toast"
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
import { Trash2 } from "lucide-react"
import { Refaccion } from "./TablaRefacciones.types"
import { ModalEditarRefaccion } from "../ModalEditarRefaccion"

interface Props {
  refrescar?: number
  datosFiltradosCodigo?: Refaccion[] | null
  datosFiltradosNoParte?: Refaccion[] | null
  busquedaCodigo: string
  busquedaNoParte: string
}

export function TablaRefacciones({
  refrescar = 0,
  datosFiltradosCodigo = null,
  datosFiltradosNoParte = null,
  busquedaCodigo,
  busquedaNoParte,
}: Props) {
  const [refacciones, setRefacciones] = useState<Refaccion[]>([])
  const [refaccionSeleccionada, setRefaccionSeleccionada] = useState<Pick<Refaccion, "codigo" | "descripcion"> | null>(null)
  const [ubicaciones, setUbicaciones] = useState([])

  const fetchRefacciones = async () => {
    try {
      const { data } = await axios.get("/api/refacciones/get")
      setRefacciones(data)
    } catch (error) {
      toast({
        title: "Error al cargar refacciones",
        description: "No se pudieron obtener los datos.",
        variant: "destructive",
      })
    }
  }

  const eliminarRefaccion = async (codigo: number, descripcion: string) => {
    try {
      await axios.delete(`/api/refacciones/get?codigo=${codigo}`)
      toast({
        title: "Refacción eliminada",
        description: `La refacción "${descripcion}" fue eliminada correctamente.`,
      })
      fetchRefacciones()
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar la refacción.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchRefacciones()
    axios.get("/api/ubicaciones/get")
      .then(res => setUbicaciones(res.data))
      .catch(err => console.error("Error al cargar ubicaciones:", err))
  }, [])

  useEffect(() => {
    if (refrescar !== 0) {
      fetchRefacciones()
    }
  }, [refrescar])

  let datosAMostrar = refacciones

  if (busquedaCodigo.trim() !== "" && datosFiltradosCodigo) {
    datosAMostrar = datosFiltradosCodigo
  } else if (busquedaNoParte.trim() !== "" && datosFiltradosNoParte) {
    datosAMostrar = datosFiltradosNoParte
  }

  const noHayResultados =
    (busquedaCodigo.trim() !== "" && datosFiltradosCodigo?.length === 0) ||
    (busquedaNoParte.trim() !== "" && datosFiltradosNoParte?.length === 0)

  // Componente reutilizable para el semáforo
  const SemaforoExistencia = ({ valor }: { valor: number }) => {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        valor <= 0 
          ? 'bg-red-500 text-white border border-red-700 shadow-sm' 
          : valor < 10 
            ? 'bg-yellow-400 text-gray-900 border border-yellow-600 shadow-sm' 
            : 'bg-green-500 text-white border border-green-700 shadow-sm'
      }`}>
        <span className="font-bold mr-1">{valor}</span>
        {valor <= 0 ? 'Sin stock' : valor < 10 ? 'Stock Bajo' : 'Disponible'}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto mt-6">
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto rounded-lg shadow">
        <table className="min-w-full text-sm border-collapse bg-white">
          <thead className="bg-[#1e3a5f] text-white sticky top-0 z-10">
            <tr>
              <th className="p-3 text-left">Código</th>
              <th className="p-3 text-left">Descripción</th>
              <th className="p-3 text-left">No. Parte</th>
              <th className="p-3 text-left">Exist. Fís.</th>
              <th className="p-3 text-left">Exist. Sist.</th>
              <th className="p-3 text-left">Diferencias</th>
              <th className="p-3 text-left">Unidad</th>
              <th className="p-3 text-left">Entrada</th>
              <th className="p-3 text-left">Salida</th>
              <th className="p-3 text-left">Proveedor</th>
              <th className="p-3 text-left">Ubicación</th>
              <th className="p-3 text-left">Reportado por</th>
              <th className="p-3 text-left">Ingreso</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {noHayResultados && (
              <tr>
                <td colSpan={16} className="text-center py-4 text-red-500 bg-[#424242] font-semibold">
                  No existe ninguna refacción con el{" "}
                  {busquedaCodigo
                    ? `código: ${busquedaCodigo}`
                    : `número de parte: ${busquedaNoParte}`}
                </td>
              </tr>
            )}

            {datosAMostrar.map((item) => (
              <tr
                key={item.codigo}
                className="border-b bg-[#424242] text-white hover:bg-gray-400 hover:text-black transition"
              >
                <td className="p-2">{item.codigo}</td>
                <td className="p-2">{item.descripcion}</td>
                <td className="p-2 min-w-[150px] max-w-[200px] overflow-hidden text-ellipsis hover:whitespace-normal">{item.noParte}</td>
                <td className="p-2">
                  <SemaforoExistencia valor={Number(item.existenciaFisica)} />
                </td>
                <td className="p-2">
                  <SemaforoExistencia valor={Number(item.existenciaSistema)} />
                </td>
                <td className="p-2">
                  <span className={`
                    inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${item.diferencias > 0 
                      ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                      : 'bg-gray-100 text-gray-800 border border-gray-300'
                    }`}
                  >
                    {item.diferencias}
                  </span>
                </td>
                  
                <td className="p-2">{item.unidadMedidaId}</td>
                <td className="p-2">{item.cantidadEntrada}</td>
                <td className="p-2">{item.cantidadSalida}</td>
                <td className="p-2">{item.proveedores}</td>
                <td className="p-2">
                  Rack {item.ubicacion?.rack}, Fila {item.ubicacion?.fila}, Pos. {item.ubicacion?.posicion}
                </td>
                <td className="p-2">{item.usuarioReportado?.nombre || `ID ${item.reportadoPorId}`}</td>
                <td className="p-2">{new Date(item.fechaIngreso).toLocaleDateString()}</td>
                <td className="p-2 text-center flex justify-center gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        onClick={() =>
                          setRefaccionSeleccionada({ codigo: item.codigo, descripcion: item.descripcion })
                        }
                        className="bg-gradient-to-b from-[#c62828] to-[#9d4245] text-white px-3 py-1 rounded-[5px] hover:bg-red-700 transition"
                      >
                        <Trash2 />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Estás a punto de eliminar la refacción <strong>{refaccionSeleccionada?.descripcion}</strong>. Esta acción no se puede revertir.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="hover:bg-white hover:text-black transition-all">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            if (refaccionSeleccionada)
                              eliminarRefaccion(refaccionSeleccionada.codigo, refaccionSeleccionada.descripcion)
                          }}
                          className="bg-red-500 hover:bg-red-700"
                        >
                          Sí, eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <ModalEditarRefaccion
                    codigo={item.codigo}
                    ubicaciones={ubicaciones}
                    onSuccess={() => fetchRefacciones()}
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