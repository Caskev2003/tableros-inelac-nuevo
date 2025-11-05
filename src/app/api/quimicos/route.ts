// src/app/api/quimicos/route.ts
import { NextResponse, NextRequest } from "next/server"
import { db } from "@/lib/db"

// Parseo flexible anclado a MEDIODÍA UTC para evitar desfases de zona
function parseFechaFlexible(input: unknown): number {
  if (!input) return NaN

  // Si ya es Date válida: ancla a 12:00 UTC del mismo día
  if (input instanceof Date && !isNaN(input.getTime())) {
    return Date.UTC(
      input.getUTCFullYear(),
      input.getUTCMonth(),
      input.getUTCDate(),
      12, 0, 0, 0
    )
  }

  const s = String(input).trim()
  const toUtcNoon = (y: number, m: number, d: number) =>
    Date.UTC(y, m - 1, d, 12, 0, 0, 0)

  // DD-MM-YYYY
  let m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (m) return toUtcNoon(+m[3], +m[2], +m[1])

  // DD/MM/YYYY
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return toUtcNoon(+m[3], +m[2], +m[1])

  // YYYY-MM-DD
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m) return toUtcNoon(+m[1], +m[2], +m[3])

  // YYYY/MM/DD
  m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
  if (m) return toUtcNoon(+m[1], +m[2], +m[3])

  // Último recurso: ISO genérico → normaliza a 12:00 UTC del día
  const d = new Date(s)
  if (!isNaN(d.getTime())) {
    return Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      12, 0, 0, 0
    )
  }

  return NaN
}

function calcDiasDeVida(fechaVenc: Date) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const diffMs = fechaVenc.getTime() - hoy.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/* --------------------------------- POST ---------------------------------- */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      codigo,
      descripcion,
      noLote,
      proveedores,
      fechaIngreso,
      fechaVencimiento,
      unidadMedidaId,
      ubicacionId,           // a veces vendrá
      ubicacion,             // o vendrá como objeto { id, ... }
      reportadoPorId,
      existenciaSistema,
      existenciaFisica,      // puede venir vacío en la UI de químicos
      cantidad,              // <- fallback si no viene existenciaFisica
      retenidos,
      productoLiberado,      // "SI" | "NO"
    } = body ?? {}

    // Coerciones + fallbacks
    const parsedCodigo = Number(codigo)
    const parsedUbicacionId = Number(
      ubicacionId ?? (ubicacion && (ubicacion.id ?? ubicacion.value))
    )
    const parsedReportadoPorId = Number(reportadoPorId)
    const parsedExistenciaSistema = Number(existenciaSistema)

    // Si la UI manda "cantidad", úsala como existenciaFisica
    const parsedExistenciaFisica = Number(
      existenciaFisica ?? cantidad ?? NaN
    )

    // Normaliza enum de unidad
    const unidadNorm = (unidadMedidaId ?? "").toString().trim().toUpperCase()

    // Validaciones mínimas (igual estilo que refacciones)
    const faltantes: string[] = []
    if (!Number.isFinite(parsedCodigo)) faltantes.push("codigo")
    if (!descripcion) faltantes.push("descripcion")
    if (!noLote) faltantes.push("noLote")
    if (!fechaIngreso) faltantes.push("fechaIngreso")
    if (!fechaVencimiento) faltantes.push("fechaVencimiento")
    if (!proveedores) faltantes.push("proveedores")
    if (!unidadNorm) faltantes.push("unidadMedidaId")
    if (!Number.isFinite(parsedUbicacionId)) faltantes.push("ubicacionId")
    if (!Number.isFinite(parsedReportadoPorId)) faltantes.push("reportadoPorId")
    if (!Number.isFinite(parsedExistenciaSistema)) faltantes.push("existenciaSistema")
    if (!Number.isFinite(parsedExistenciaFisica)) faltantes.push("existenciaFisica (o cantidad)")

    if (faltantes.length) {
      return NextResponse.json(
        { error: "Datos faltantes o inválidos", fields: faltantes },
        { status: 400 }
      )
    }

    // Fechas (ancladas a 12:00 UTC)
    const msIngreso = parseFechaFlexible(String(fechaIngreso))
    if (!Number.isFinite(msIngreso)) {
      return NextResponse.json({ error: "Fecha de ingreso inválida" }, { status: 400 })
    }
    const parsedFechaIngreso = new Date(msIngreso)

    const msVenc = parseFechaFlexible(String(fechaVencimiento))
    if (!Number.isFinite(msVenc)) {
      return NextResponse.json({ error: "Fecha de vencimiento inválida" }, { status: 400 })
    }
    const parsedFechaVenc = new Date(msVenc)

    // Unicidad: (codigo, noLote)
    const existe = await db.quimicos.findFirst({
      where: { codigo: parsedCodigo, noLote },
      select: { id: true },
    })
    if (existe) {
      return NextResponse.json(
        { error: "Duplicado", message: "Ya existe un registro con este código y lote" },
        { status: 409 }
      )
    }

    const diferencias = Math.abs(parsedExistenciaFisica - parsedExistenciaSistema)
    const diasDeVida = calcDiasDeVida(parsedFechaVenc)

    const creado = await db.$transaction(async (tx) => {
      const nuevo = await tx.quimicos.create({
        data: {
          codigo: parsedCodigo,
          descripcion,
          noLote,
          existenciaFisica: parsedExistenciaFisica,
          existenciaSistema: parsedExistenciaSistema,
          diferencias,
          proveedores,
          cantidadEntrada: parsedExistenciaFisica,
          cantidadSalida: 0,
          fechaIngreso: parsedFechaIngreso,
          fechaVencimiento: parsedFechaVenc,
          diasDeVida,
          retenidos: Number(retenidos) || 0,
          productoLiberado: String(productoLiberado).toUpperCase() === "SI" ? "SI" : "NO",
          movimiento: "NUEVO_INGRESO",
          unidadMedidaId: unidadNorm as any,
          ubicacion: { connect: { id: parsedUbicacionId } },
          usuarioReportado: { connect: { id: parsedReportadoPorId } },
        },
      })

      await tx.historial_movimientos.create({
        data: {
          codigo: nuevo.codigo,
          descripcion: nuevo.descripcion,
          noParte: nuevo.noLote,
          movimiento: "NUEVO_INGRESO",
          cantidad: parsedExistenciaFisica,
          existenciaFisicaDespues: parsedExistenciaFisica,
          reportadoPorId: parsedReportadoPorId,
          almacenEnum: "QUIMICOS",
          almacenText: "Almacén de Químicos",
        },
      } as any)

      return nuevo
    })

    return NextResponse.json(
      { success: true, message: "Químico registrado correctamente", data: creado },
      { status: 200 }
    )
  } catch (err: any) {
    console.error("❌ Error al registrar químico:", err)
    return NextResponse.json({ error: "INTERNAL ERROR", detail: err?.message }, { status: 500 })
  }
}

/* ---------------------------------- GET ---------------------------------- */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const codigo = searchParams.get("codigo")
    const noLote = searchParams.get("noLote")

    if (codigo && noLote) {
      const q = await db.quimicos.findFirst({
        where: { codigo: Number(codigo), noLote },
        include: {
          ubicacion: true,
          usuarioReportado: { select: { nombre: true, rol: true } },
        },
      })
      if (!q) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
      return NextResponse.json(q)
    }

    const limit = Number(searchParams.get("limit")) || undefined
    const offset = Number(searchParams.get("offset")) || 0

    const list = await db.quimicos.findMany({
      include: {
        ubicacion: true,
        usuarioReportado: { select: { nombre: true, rol: true } },
      },
      orderBy: { codigo: "asc" },
      take: limit,
      skip: offset,
    })

    return NextResponse.json(list)
  } catch (err: any) {
    console.error("❌ Error GET /quimicos:", err)
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 })
  }
}

/* -------------------------------- DELETE --------------------------------- */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let codigo = searchParams.get("codigo")
    let noLote = searchParams.get("noLote")

    if ((!codigo || !noLote) && request.method === "DELETE") {
      try {
        const body = await request.json()
        codigo = body?.codigo
        noLote = body?.noLote
      } catch {}
    }

    if (!codigo || !noLote) {
      return NextResponse.json(
        { error: "Se requieren código y número de lote" },
        { status: 400 }
      )
    }

    const existente = await db.quimicos.findFirst({
      where: { codigo: Number(codigo), noLote },
      include: { usuarioReportado: { select: { id: true, nombre: true } } },
    })
    if (!existente) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    await db.$transaction(async (tx) => {
      await tx.historial_movimientos.create({
        data: {
          codigo: existente.codigo,
          descripcion: existente.descripcion,
          noParte: existente.noLote,
          movimiento: "ELIMINADO",
          cantidad: existente.existenciaFisica,
          existenciaFisicaDespues: 0,
          reportadoPorId: existente.reportadoPorId,
          fechaMovimiento: new Date(),
          almacenEnum: "QUIMICOS",
          almacenText: "Almacén de Químicos",
        },
      } as any)

      await tx.quimicos.delete({ where: { id: existente.id } })
    })

    return NextResponse.json({
      success: true,
      message: "Químico eliminado correctamente",
      data: { codigo: Number(codigo), noLote },
    })
  } catch (err: any) {
    console.error("❌ Error DELETE /quimicos:", err)
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 })
  }
}
