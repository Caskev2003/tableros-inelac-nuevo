"use client"

import { useState } from "react"
import { BarraBusquedaRefacciones } from "../BarraBusquedaRefacciones/BarraBusquedaRefacciones"
import { BarraBusquedaNoParte } from "../BarraBusquedaNoParte/BarraBusquedaNoParte"
import { TablaRefaccionesHistorial } from "../TablaRefaccionesHistorial"

export function HistorialMovimientosClient() {
  const [refrescar] = useState<number>(0)

  const [filtroCodigo, setFiltroCodigo] = useState<any[] | null>(null)
  const [codigoActivo, setCodigoActivo] = useState("")

  const [filtroNoParte, setFiltroNoParte] = useState<any[] | null>(null)
  const [noParteActivo, setNoParteActivo] = useState("")

  

  const limpiarFiltros = () => {
    setFiltroCodigo(null)
    setCodigoActivo("")
    setFiltroNoParte(null)
    setNoParteActivo("")
  }

  return (
    <div className="w-full">
     <div className="flex flex-col items-center gap-4">
  <div className="flex flex-wrap justify-center gap-4">
    <div className="flex flex-col items-start">
    <label className="text-white mb-1 ml-3">Buscar por código:</label>
      <BarraBusquedaRefacciones
        onResultados={(res, query) => {
          setFiltroCodigo(res)
          setCodigoActivo(query)
          setFiltroNoParte(null)
          setNoParteActivo("")
        }}
        onLimpiar={() => {
          setFiltroCodigo(null)
          setCodigoActivo("")
        }}
      />
    </div>

    <div className="flex flex-col items-start">
    <label className="text-white mb-1 ml-3">Buscar por No. parte:</label>
      <BarraBusquedaNoParte
        onResultados={(res, query) => {
          setFiltroNoParte(res)
          setNoParteActivo(query)
          setFiltroCodigo(null)
          setCodigoActivo("")
        }}
        onLimpiar={() => {
          setFiltroNoParte(null)
          setNoParteActivo("")
        }}
      />
    </div>
  </div>
</div>


      {/*Componente de TablaRefacciones */}
      <div className="px-2 sm:px-4 md:px-6">
        <TablaRefaccionesHistorial
          refrescar={refrescar}
          datosFiltradosCodigo={filtroCodigo}
          datosFiltradosNoParte={filtroNoParte}
          busquedaCodigo={codigoActivo}
          busquedaNoParte={noParteActivo}
        />
      </div>
    </div>
  )
}
