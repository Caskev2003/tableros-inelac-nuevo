"use client"

import { useEffect, useRef, useState } from "react"
import axios from "axios"
import { Quimico } from "../TablaQuimicos/TablaQuimicos.types"

interface Props {
  onResultados: (data: Quimico[], query: string) => void
  onLimpiar: () => void
  desactivar?: boolean
}

export function BarraBusquedaQuimicos({ onResultados, onLimpiar, desactivar }: Props) {
  const [busqueda, setBusqueda] = useState("")
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const delay = setTimeout(() => {
      const query = busqueda.trim()

      if (query === "") {
        onLimpiar()
        return
      }

      if (controllerRef.current) {
        controllerRef.current.abort()
      }
      if (desactivar) return

      const controller = new AbortController()
      controllerRef.current = controller

      axios
        .get(`/api/quimicos/buscar?query=${query}`, {
          signal: controller.signal,
        })
        .then((res) => {
          if (Array.isArray(res.data)) {
            onResultados(res.data, query)
          }
        })
        .catch((err) => {
          if (!axios.isCancel(err)) {
            console.error("Error al filtrar por código:", err)
          }
        })
    }, 400)

    return () => {
      clearTimeout(delay)
      controllerRef.current?.abort()
    }
  }, [busqueda, onResultados, onLimpiar, desactivar])

  return (
    <div className="flex flex-col w-full sm:w-auto sm:min-w-[280px]">
      <input
        type="number"
        placeholder="Buscar por código de químico"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-[260px] px-3 py-2 rounded-full bg-white text-black border border-gray-300 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}