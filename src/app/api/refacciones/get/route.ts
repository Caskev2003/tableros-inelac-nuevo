import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const refacciones = await db.refacciones_l3.findMany({
      include: {
        ubicacion: true,
        usuarioReportado: {
          select: { id: true, nombre: true },
        },
      },
      orderBy: { fechaIngreso: "desc" },
    });

    return NextResponse.json(refacciones);
  } catch (error) {
    console.error("Error al obtener refacciones:", error);
    return new NextResponse("INTERNAL ERROR", { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const codigo = Number(req.nextUrl.searchParams.get("codigo"));
    if (!codigo) return new NextResponse("Código requerido", { status: 400 });

    // 1) Traer la refacción antes de borrar (para registrar en historial)
    const refaccion = await db.refacciones_l3.findUnique({
      where: { codigo },
      select: {
        codigo: true,
        descripcion: true,
        noParte: true,
        existenciaFisica: true,
        reportadoPorId: true,
      },
    });

    if (!refaccion) {
      return new NextResponse("Refacción no encontrada", { status: 404 });
    }

    // 2) Transacción: crear historial y eliminar refacción
    await db.$transaction(async (tx) => {
      await tx.historial_movimientos.create({
        data: {
          // ← Campos reales de tu modelo
          codigo: refaccion.codigo,
          descripcion: refaccion.descripcion,
          noParte: refaccion.noParte,
          movimiento: "ELIMINADO",
          cantidad: refaccion.existenciaFisica,
          existenciaFisicaDespues: 0,
          reportadoPorId: refaccion.reportadoPorId,
          // opcional pero recomendado para tu UI:
          almacenEnum: "REFACCIONES",
          almacenText: "Almacén de Refacciones",
          // fechaMovimiento tiene default(now())
        },
      });

      await tx.refacciones_l3.delete({ where: { codigo } });
    });

    return NextResponse.json({ mensaje: "Refacción eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar refacción:", error);
    return new NextResponse("INTERNAL ERROR", { status: 500 });
  }
}
