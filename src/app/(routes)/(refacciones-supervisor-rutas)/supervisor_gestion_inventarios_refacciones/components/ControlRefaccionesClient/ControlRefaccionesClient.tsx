"use client"

import { useState } from "react"
import { RefaccionesForm } from "../registro-refacciones/RefaccionesForm"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { TablaRefacciones } from "../TablaRefacciones/TablaRefacciones"
import { ButtonRegresar } from "../ButtonRegresar"
import { BarraBusquedaRefacciones } from "../BarraBusquedaRefacciones/BarraBusquedaRefacciones"
import { BarraBusquedaNoParte } from "../BarraBusquedaNoParte/BarraBusquedaNoParte"
import MovimientoStock from "../MovimientoStock/MovimientoStock"


export default function ControlRefaccionesClient() {
  const [open, setOpen] = useState(false)
  const [refrescar, setRefrescar] = useState<number>(0)

  const [filtroCodigo, setFiltroCodigo] = useState<any[] | null>(null)
  const [codigoActivo, setCodigoActivo] = useState("")

  const [filtroNoParte, setFiltroNoParte] = useState<any[] | null>(null)
  const [noParteActivo, setNoParteActivo] = useState("")

  const manejarRegistroExitoso = () => {
    setOpen(false)
    setRefrescar(Date.now())
    limpiarFiltros()
  }

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
          {/* filtros */}
          <div className="flex flex-col items-start">
            <label className="text-white mb-1">Buscar por código:</label>
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
            <label className="text-white mb-1">Buscar por No. parte:</label>
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

        <div className="mt-2 flex justify-center gap-4">
          <ButtonRegresar />

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button  className="text-white px-4 py-2 rounded-full text-sm sm:text-base font-semibold bg-[#426689] transition-all duration-200 hover:bg-gradient-to-b hover:from-green-700 hover:to-green-500">
                Nueva Refacción
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl w-full !rounded-xl !border-none shadow-xl bg-[#2b2b2b] text-white">
              <p className="text-2xl font-semibold mb-4 text-center">Registrar Refacción</p>
              <RefaccionesForm
                onSuccess={manejarRegistroExitoso}
              />
            </DialogContent>
          </Dialog>

          <div className="text-white px-4 py-2 rounded-full text-sm sm:text-base font-semibold bg-[#426689] transition-all duration-200 hover:bg-gradient-to-b hover:from-green-700 hover:to-green-500">
            <MovimientoStock onSuccess={manejarRegistroExitoso} />
          </div>
        </div>
      </div>

      <div className="px-2 sm:px-4 md:px-6">
        <TablaRefacciones
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
