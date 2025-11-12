"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { toast } from "@/hooks/use-toast"
import { Quimico } from "./TablaQuimicos.types"

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
  currentPage?: number
  onPageChange?: (page: number) => void
  itemsPerPage?: number
}

export function TablaQuimicos({
  refrescar = 0,
  datosFiltradosCodigo = null,
  datosFiltradosNoLote = null,
  busquedaCodigo,
  busquedaNoLote,
  currentPage = 1,
  onPageChange,
  itemsPerPage = 10 // ↓ ahora 10
}: Props) {
  const [quimicos, setQuimicos] = useState<Quimico[]>([])
  const [ubicaciones, setUbicaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // --- Estado interno para paginación cuando el padre no controla ---
  const [internalPage, setInternalPage] = useState<number>(currentPage)
  // Mantener sincronía si el padre actualiza currentPage
  useEffect(() => { setInternalPage(currentPage) }, [currentPage])

  // page efectivo: controlado (prop) o no controlado (estado interno)
  const page = onPageChange ? currentPage : internalPage

  // Calcular datos paginados con la página efectiva
  const indexOfLastItem = page * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage

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

  const currentItems = datosAMostrar.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.max(1, Math.ceil(datosAMostrar.length / itemsPerPage))

  // Si cambian los datos y la página se sale de rango, clamp
  useEffect(() => {
    const clamped = Math.max(1, Math.min(page, totalPages))
    if (clamped !== page) {
      onPageChange ? onPageChange(clamped) : setInternalPage(clamped)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]) // recalcular el total

  const noHayResultados = (
    (busquedaCodigo.trim() && datosFiltradosCodigo?.length === 0) ||
    (busquedaNoLote.trim() && datosFiltradosNoLote?.length === 0)
  )

  const handlePageChange = (newPage: number) => {
    const clamped = Math.max(1, Math.min(newPage, totalPages))
    if (onPageChange) onPageChange(clamped)
    else setInternalPage(clamped)
  }

  const formatValue = (value: any, type?: 'date' | 'number') => {
    if (value == null) return '-'
    if (type === 'date') return new Date(value).toLocaleDateString()
    if (type === 'number') return Number(value).toLocaleString()
    return String(value)
  }

  // ---- Paginación con "..." ----
  const buildPageList = (tp: number, cp: number): (number | 'ellipsis')[] => {
    if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1)
    if (cp <= 4) return [1, 2, 3, 4, 5, 'ellipsis', tp]
    if (cp >= tp - 3) return [1, 'ellipsis', tp - 4, tp - 3, tp - 2, tp - 1, tp]
    return [1, 'ellipsis', cp - 1, cp, cp + 1, 'ellipsis', tp]
  }
  const pageList = buildPageList(totalPages, page)

  return (
    <div className="overflow-x-auto mt-6">
      {/* Controles de paginación - SIEMPRE VISIBLES */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 bg-[#2b2b2b] p-3 rounded-lg">
        {/* Conteo de registros */}
        <div className="text-sm font-medium text-blue-300">
          Mostrando <span className="font-bold text-white">
            {datosAMostrar.length === 0 ? 0 : indexOfFirstItem + 1}-{Math.min(indexOfLastItem, datosAMostrar.length)}
          </span> de <span className="font-bold text-white">{datosAMostrar.length}</span> registros
        </div>
        
        {/* Controles de navegación - Mostrar solo si hay más de 1 página */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-all ${
                page === 1 
                  ? 'text-gray-400 bg-gray-700 cursor-not-allowed' 
                  : 'text-white bg-blue-600 hover:bg-blue-700 shadow-md'
              }`}
            >
              Anterior
            </button>
            
            <div className="flex items-center gap-1">
              {pageList.map((p, i) => {
                if (p === 'ellipsis') {
                  return (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-2 text-blue-300 select-none"
                    >
                      …
                    </span>
                  )
                }
                const pageNum = p as number
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 text-sm rounded-md font-medium transition-all ${
                      page === pageNum
                        ? 'text-white bg-orange-600 shadow-md transform scale-105'
                        : 'text-blue-300 bg-[#3a3a3a] hover:bg-[#4a4a4a]'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            
            <button 
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-all ${
                page === totalPages 
                  ? 'text-gray-400 bg-gray-700 cursor-not-allowed' 
                  : 'text-white bg-blue-600 hover:bg-blue-700 shadow-md'
              }`}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
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

            {!loading && currentItems.map((item) => (
              <tr
                key={`${item.codigo}-${item.noLote}`}
                className="border-b bg-[#424242] text-white hover:bg-gray-400 hover:text-black transition"
              >
                <td className="p-2">{item.codigo}</td>
                <td className="p-2">{item.descripcion}</td>
                <td className="p-2 whitespace-nowrap">{item.noLote}</td>
                
                <td className="p-2">
                  <SemaforoExistencia valor={Number(item.existenciaFisica) || 0} />
                </td>
                <td className="p-2">
                  <SemaforoExistencia valor={Number(item.existenciaSistema) || 0} />
                </td>
                
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
