"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { toast } from "@/hooks/use-toast"
import ExportHistorialModal from "../ExportHistorialModal/ExportHistorialModal"
import { FileSpreadsheet } from "lucide-react" // ⬅️ ícono del botón

type MovTipo = "ENTRADA" | "SALIDA" | "NUEVO_INGRESO" | "EDITADO" | "ELIMINADO"
type AlmacenEnum = "REFACCIONES" | "QUIMICOS"

interface Movimiento {
  id: number
  codigo: number
  codigoRefaccion?: number
  descripcion: string
  noParte: string
  movimiento: MovTipo
  cantidad: number
  existenciaFisicaDespues: number
  fechaMovimiento: string
  reportadoPorId: number
  usuarioReportado?: { nombre?: string }
  almacenEnum?: AlmacenEnum | null
  almacenText?: string | null
  almacenLabel?: string
}

interface Props {
  refrescar?: number
  datosFiltradosCodigo?: Movimiento[] | null
  datosFiltradosNoParte?: Movimiento[] | null
  busquedaCodigo: string
  busquedaNoParte: string
}

function getPageItems(current: number, total: number, siblings = 1): Array<number | "…"> {
  const totalNumbers = siblings * 2 + 3
  if (total <= totalNumbers) return Array.from({ length: total }, (_, i) => i + 1)
  const left = Math.max(2, current - siblings)
  const right = Math.min(total - 1, current + siblings)
  const items: Array<number | "…"> = [1]
  if (left > 2) items.push("…"); else for (let i = 2; i < left; i++) items.push(i)
  for (let i = left; i <= right; i++) items.push(i)
  if (right < total - 1) items.push("…"); else for (let i = right + 1; i < total; i++) items.push(i)
  items.push(total)
  return items
}

export function TablaRefaccionesHistorial({
  refrescar = 0,
  datosFiltradosCodigo = null,
  datosFiltradosNoParte = null,
  busquedaCodigo,
  busquedaNoParte,
}: Props) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(false)

  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const mapAlmacen = (m: any): string => {
    if (m?.almacenEnum === "REFACCIONES") return "Almacén de Refacciones"
    if (m?.almacenEnum === "QUIMICOS") return "Almacén de Químicos"
    const txt = (m?.almacenText ?? m?.almacen ?? "") as string
    if (/quim/i.test(txt)) return "Almacén de Químicos"
    if (/refac/i.test(txt)) return "Almacén de Refacciones"
    return txt || "—"
  }

  const fetchHistorial = async (p = page) => {
    try {
      setLoading(true)
      const { data } = await axios.get("/api/refacciones/historial-movimiento", {
        params: { page: p, pageSize },
      })
      const items: Movimiento[] = (data.items ?? []).map((it: any) => {
        const cod = Number(it.codigo)
        return {
          id: it.id,
          codigo: cod,
          codigoRefaccion: cod,
          descripcion: it.descripcion,
          noParte: it.noParte,
          movimiento: it.movimiento,
          cantidad: it.cantidad,
          existenciaFisicaDespues: it.existenciaFisicaDespues,
          fechaMovimiento: it.fechaMovimiento,
          reportadoPorId: it.reportadoPorId,
          usuarioReportado: it.usuarioReportado,
          almacenEnum: it.almacenEnum ?? it.almacen_enum ?? undefined,
          almacenText: it.almacenText ?? it.almacen ?? undefined,
          almacenLabel: mapAlmacen(it),
        }
      })

      setMovimientos(items)
      setTotal(data.total ?? items.length)
      setTotalPages(data.totalPages ?? Math.max(Math.ceil((data.total ?? items.length) / pageSize), 1))
      setPage(data.page ?? p)
    } catch {
      toast({
        title: "Error al cargar historial",
        description: "No se pudieron obtener los datos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistorial(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (refrescar !== 0) fetchHistorial(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refrescar])

  const hayBusquedaCodigo = busquedaCodigo.trim() !== "" && !!datosFiltradosCodigo
  const hayBusquedaNoParte = busquedaNoParte.trim() !== "" && !!datosFiltradosNoParte

  let datosBase: Movimiento[] = movimientos
  let totalLocal = total
  let totalPagesLocal = totalPages

  if (hayBusquedaCodigo) {
    datosBase = datosFiltradosCodigo || []
    totalLocal = datosBase.length
    totalPagesLocal = Math.max(Math.ceil(totalLocal / pageSize), 1)
  } else if (hayBusquedaNoParte) {
    datosBase = datosFiltradosNoParte || []
    totalLocal = datosBase.length
    totalPagesLocal = Math.max(Math.ceil(totalLocal / pageSize), 1)
  }

  const datosAMostrar =
    hayBusquedaCodigo || hayBusquedaNoParte
      ? datosBase.slice((page - 1) * pageSize, page * pageSize)
      : datosBase

  const noHayResultados =
    (hayBusquedaCodigo && (datosFiltradosCodigo?.length || 0) === 0) ||
    (hayBusquedaNoParte && (datosFiltradosNoParte?.length || 0) === 0)

  useEffect(() => {
    if (hayBusquedaCodigo || hayBusquedaNoParte) setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busquedaCodigo, busquedaNoParte, datosFiltradosCodigo, datosFiltradosNoParte])

  const canPrev = page > 1
  const canNext = page < totalPagesLocal
  const start = totalLocal === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalLocal)

  const [openExport, setOpenExport] = useState(false)

  return (
    <div className="overflow-x-auto mt-6">
      {/* Botón con estilo de tu imagen */}
      <button
        onClick={() => setOpenExport(true)}
        className="
          group inline-flex items-center gap-3
          rounded-sm px-6 py-3
          font-semibold text-white
          shadow-[0_8px_24px_rgba(0,0,0,.25)]
          bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600
          hover:brightness-110 active:scale-[0.99] transition
        "
      >
        <span
          className="
            inline-flex h-6 w-6 items-center justify-center
            rounded-sm bg-white/20 ring-1 ring-white/25
          "
        >
          <FileSpreadsheet className="h-4 w-4" />
        </span>
        Exportar Excel
      </button>

      {/* Barra de paginación arriba con elipsis */}
      <div className="mb-3 mt-4 flex items-center justify-between">
        <div className="text-sm text-blue-700 font-medium">
          Mostrando registros <b>{start}-{end}</b> de <b>{totalLocal}</b>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-blue-700 font-medium">
            Página <b>{page}</b> de <b>{totalPagesLocal}</b>
          </span>

          <button
            className="px-3 py-1 text-sm border rounded-sm bg-white text-black hover:bg-gray-100 disabled:opacity-50"
            disabled={!canPrev || loading}
            onClick={() => {
              const nxt = page - 1
              if (hayBusquedaCodigo || hayBusquedaNoParte) setPage(nxt)
              else fetchHistorial(nxt)
            }}
          >
            ANTERIOR
          </button>

          {getPageItems(page, totalPagesLocal, 1).map((p, idx) =>
            p === "…" ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-blue-700 bg-zinc-300 select-none">…</span>
            ) : (
              <button
                key={`p-${p}`}
                className={`px-3 py-1 text-sm border rounded-sm font-semibold ${
                  p === page ? "bg-red-700 text-white" : "bg-zinc-300 hover:bg-gray-100 text-blue-700"
                }`}
                disabled={loading}
                onClick={() => {
                  if (typeof p !== "number") return
                  if (hayBusquedaCodigo || hayBusquedaNoParte) setPage(p)
                  else fetchHistorial(p)
                }}
              >
                {p}
              </button>
            )
          )}

          <button
            className="px-3 py-1 text-sm border rounded-sm bg-white text-black hover:bg-gray-100 disabled:opacity-50"
            disabled={!canNext || loading}
            onClick={() => {
              const nxt = page + 1
              if (hayBusquedaCodigo || hayBusquedaNoParte) setPage(nxt)
              else fetchHistorial(nxt)
            }}
          >
            SIGUIENTE
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto rounded-lg shadow">
        <table className="min-w-full text-sm border-collapse bg-white">
          <thead className="bg-[#1e3a5f] text-white sticky top-0 z-10">
            <tr>
              <th className="p-3 text-left">Código</th>
              <th className="p-3 text-left">Descripción</th>
              <th className="p-3 text-left">No. Parte</th>
              <th className="p-3 text-left">Movimiento</th>
              <th className="p-3 text-left">Cantidad</th>
              <th className="p-3 text-left">Stock actual</th>
              <th className="p-3 text-left">Almacén</th>
              <th className="p-3 text-left">Realizado por</th>
              <th className="p-3 text-left">Fecha</th>
            </tr>
          </thead>

          <tbody>
            {noHayResultados ? (
              <tr>
                <td colSpan={9} className="text-center py-4 text-red-500 bg-[#424242] font-semibold">
                  No existe historial con el{" "}
                  {busquedaCodigo ? `código: ${busquedaCodigo}` : `número de parte: ${busquedaNoParte}`}
                </td>
              </tr>
            ) : loading ? (
              <tr>
                <td colSpan={9} className="text-center py-4 bg-[#424242] text-white">
                  Cargando…
                </td>
              </tr>
            ) : (
              datosAMostrar.map((item) => (
                <tr
                  key={item.id}
                  className="border-b bg-[#424242] text-white hover:bg-gray-400 hover:text-black transition"
                >
                  <td className="p-2">{item.codigoRefaccion ?? item.codigo}</td>
                  <td className="p-2">{item.descripcion}</td>
                  <td className="p-2">{item.noParte}</td>
                  <td className="p-2">{item.movimiento}</td>
                  <td className="p-2">{item.cantidad}</td>
                  <td className="p-2">{item.existenciaFisicaDespues}</td>
                  <td className="p-2">{item.almacenLabel ?? "—"}</td>
                  <td className="p-2">{item.usuarioReportado?.nombre || `ID ${item.reportadoPorId}`}</td>
                  <td className="p-2">{new Date(item.fechaMovimiento).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ExportHistorialModal open={openExport} onClose={() => setOpenExport(false)} />
    </div>
  )
}
