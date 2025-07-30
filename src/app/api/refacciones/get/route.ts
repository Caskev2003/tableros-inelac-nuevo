import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const refacciones = await db.refacciones_l3.findMany({
      include: {
        ubicacion: true, // puede ser null, Prisma lo permite
        usuarioReportado: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { fechaIngreso: "desc" },
    })

    return NextResponse.json(refacciones)
  } catch (error) {
    console.error("Error al obtener refacciones:", error)
    return new NextResponse("INTERNAL ERROR", { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const codigo = Number(req.nextUrl.searchParams.get("codigo"))
    if (!codigo) return new NextResponse("Código requerido", { status: 400 })

    // 1. Obtener refacción antes de eliminar
    const refaccion = await db.refacciones_l3.findUnique({
      where: { codigo },
    })

    if (!refaccion) {
      return new NextResponse("Refacción no encontrada", { status: 404 })
    }

    // 2. Eliminar la refacción
    await db.refacciones_l3.delete({ where: { codigo } })

    // 3. Registrar movimiento en historial
    await db.historial_movimientos.create({
      data: {
        codigoRefaccion: refaccion.codigo,
        descripcion: refaccion.descripcion,
        noParte: refaccion.noParte,
        movimiento: "ELIMINADO", // enum Movimiento
        cantidad: refaccion.existenciaFisica,
        existenciaFisicaDespues: 0,
        usuarioReportado: {
          connect: { id: refaccion.reportadoPorId }
        }
      }
    })

    return NextResponse.json({ mensaje: "Refacción eliminada correctamente" })

  } catch (error) {
    console.error("Error al eliminar refacción:", error)
    return new NextResponse("INTERNAL ERROR", { status: 500 })
  }
}
