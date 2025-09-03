"use client"

import { useState, useEffect } from "react"
import axios from "axios"

interface Props {
  onResultados: (data: any[], query: string) => void
  onLimpiar: () => void
  desactivar?: boolean
}

export function BarraBusquedaNoParte({ onResultados, onLimpiar, desactivar }: Props) {
  const [busqueda, setBusqueda] = useState("")

  useEffect(() => {
    const fetchFiltrado = async () => {
      if (busqueda.trim() === "") {
        onLimpiar()
        return
      }

      if (desactivar) return

      try {
        const res = await axios.get(`/api/refacciones/buscar-no-parte?query=${busqueda}`)
        onResultados(res.data, busqueda)
      } catch (error) {
        console.error("Error al filtrar por No. Parte:", error)
      }
    }

    const timeout = setTimeout(fetchFiltrado, 300)
    return () => clearTimeout(timeout)
  }, [busqueda, onResultados, onLimpiar])

  return (
    <div className="flex flex-col w-full sm:w-auto sm:min-w-[280px] rounded-full">
    <input
      type="text"
      placeholder="Ingresa No. de parte de la refacción"
      value={busqueda}
      onChange={(e) => setBusqueda(e.target.value)}
      className="w-[280px] px-3 py-2 rounded-full bg-white
      text-black border border-gray-300 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
  )
}
