"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { toast } from "@/hooks/use-toast"

interface Movimiento {
  id: number
  codigoRefaccion: number
  descripcion: string
  noParte: string
  movimiento: "ENTRADA" | "SALIDA" | "NUEVO_INGRESO"
  cantidad: number
  existenciaFisicaDespues: number
  fechaMovimiento: string
  usuarioReportado?: {
    nombre?: string
  }
  reportadoPorId: number
}

interface Props {
  refrescar?: number
  datosFiltradosCodigo?: Movimiento[] | null
  datosFiltradosNoParte?: Movimiento[] | null
  busquedaCodigo: string
  busquedaNoParte: string
}

export function TablaRefaccionesHistorial({
  refrescar = 0,
  datosFiltradosCodigo = null,
  datosFiltradosNoParte = null,
  busquedaCodigo,
  busquedaNoParte,
}: Props) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])

  const fetchHistorial = async () => {
    try {
      const { data } = await axios.get("/api/refacciones/historial-movimiento")
      setMovimientos(data)
    } catch (error) {
      toast({
        title: "Error al cargar historial",
        description: "No se pudieron obtener los datos.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchHistorial()
  }, [])

  useEffect(() => {
    if (refrescar !== 0) {
      fetchHistorial()
    }
  }, [refrescar])

  // aplicar filtros si hay búsquedas activas
  let datosAMostrar = movimientos

  if (busquedaCodigo.trim() !== "" && datosFiltradosCodigo) {
    datosAMostrar = datosFiltradosCodigo
  } else if (busquedaNoParte.trim() !== "" && datosFiltradosNoParte) {
    datosAMostrar = datosFiltradosNoParte
  }

  const noHayResultados =
    (busquedaCodigo.trim() !== "" && datosFiltradosCodigo?.length === 0) ||
    (busquedaNoParte.trim() !== "" && datosFiltradosNoParte?.length === 0)

  return (
    <div className="overflow-x-auto mt-6">
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto rounded-lg shadow">
        <table className="min-w-full text-sm border-collapse bg-white">
          <thead className="bg-[#1e3a5f] text-white sticky top-0 z-10">
            <tr>
              <th className="p-3 text-left">Código</th>
              <th className="p-3 text-left">Descripción</th>
              <th className="p-3 text-left">No. Parte</th>
              <th className="p-3 text-left">Movimiento</th>
              <th className="p-3 text-left">Cantidad ingresada</th>
              <th className="p-3 text-left">Stock actual</th>
              <th className="p-3 text-left">Realizado por</th>
              <th className="p-3 text-left">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {noHayResultados ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-red-500 bg-[#424242] font-semibold">
                  No existe historial con el{" "}
                  {busquedaCodigo
                    ? `código: ${busquedaCodigo}`
                    : `número de parte: ${busquedaNoParte}`}
                </td>
              </tr>
            ) : (
              datosAMostrar.map((item) => (
                <tr
                  key={item.id}
                  className="border-b bg-[#424242] text-white hover:bg-gray-400 hover:text-black transition"
                >
                  <td className="p-2">{item.codigoRefaccion}</td>
                  <td className="p-2">{item.descripcion}</td>
                  <td className="p-2">{item.noParte}</td>
                  <td className="p-2">{item.movimiento}</td>
                  <td className="p-2">{item.cantidad}</td>
                  <td className="p-2">{item.existenciaFisicaDespues}</td>
                  <td className="p-2">{item.usuarioReportado?.nombre || `ID ${item.reportadoPorId}`}</td>
                  <td className="p-2">{new Date(item.fechaMovimiento).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
