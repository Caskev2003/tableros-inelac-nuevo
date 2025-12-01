"use client"

import { useState } from "react"
import { BarraBusquedaRefacciones } from "../BarraBusquedaRefacciones/BarraBusquedaRefacciones"
import { BarraBusquedaNoParte } from "../BarraBusquedaNoParte/BarraBusquedaNoParte"
import { TablaRefaccionesHistorial } from "../TablaRefaccionesHistorial"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

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
/* ------------------------- Botón Regresar (inline) ------------------------ */
function ButtonRegresar({ href }: { href?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => (href ? router.push(href) : router.back())}
      aria-label="Regresar"
      className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-2 text-white backdrop-blur transition
                 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
    >
      <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
      <span className="hidden sm:inline">Regresar</span>
    </button>
  )
}
  return (
    <div className="w-full">
      <ButtonRegresar/>
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
