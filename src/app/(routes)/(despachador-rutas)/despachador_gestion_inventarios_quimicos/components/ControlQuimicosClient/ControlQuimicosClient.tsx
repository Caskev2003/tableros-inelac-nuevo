"use client"

import { useState } from "react"
import { Quimico } from "../TablaQuimicos/TablaQuimicos.types"
import { TablaQuimicos } from "../TablaQuimicos/TablaQuimicos"
import { ButtonRegresar } from "../ButtonRegresar"
import { BarraBusquedaQuimicos } from "../BarraBusquedaQuimicos/BarraBusquedaQuimicos"
import { BarraBusquedaNoLote } from "../BarraBusquedaNoLote/BarraBusquedaNoLote"

export default function ControlQuimicosClient() {
  const [refrescar] = useState<number>(0)
  const [filtroCodigo, setFiltroCodigo] = useState<Quimico[] | null>(null)
  const [codigoActivo, setCodigoActivo] = useState<string>("")
  const [filtroNoLote, setFiltroNoLote] = useState<Quimico[] | null>(null)
  const [noLoteActivo, setNoLoteActivo] = useState<string>("")

  return (
    <div className="w-full">
      <div className="flex flex-col items-center gap-4">
        {/* Sección de filtros */}
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex flex-col items-start">
            <label className="text-white mb-1">Buscar por código:</label>
            <BarraBusquedaQuimicos
              onResultados={(res: Quimico[], query: string) => {
                setFiltroCodigo(res)
                setCodigoActivo(query)
                setFiltroNoLote(null)
                setNoLoteActivo("")
              }}
              onLimpiar={() => {
                setFiltroCodigo(null)
                setCodigoActivo("")
              }}
            />
          </div>

          <div className="flex flex-col items-start">
            <label className="text-white mb-1">Buscar por No. lote:</label>
            <BarraBusquedaNoLote
              onResultados={(res: Quimico[], query: string) => {
                setFiltroNoLote(res)
                setNoLoteActivo(query)
                setFiltroCodigo(null)
                setCodigoActivo("")
              }}
              onLimpiar={() => {
                setFiltroNoLote(null)
                setNoLoteActivo("")
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabla de resultados */}
      <div className="px-2 sm:px-4 md:px-6">
        <TablaQuimicos
          refrescar={refrescar}
          datosFiltradosCodigo={filtroCodigo}
          datosFiltradosNoLote={filtroNoLote}
          busquedaCodigo={codigoActivo}
          busquedaNoLote={noLoteActivo}
        />
      </div>
      {/* Sección de acciones */}
        <div className="mt-10 flex justify-center gap-4">
          <ButtonRegresar />
        </div>
    </div>
  )
}