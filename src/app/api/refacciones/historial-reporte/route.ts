import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start"); // "YYYY-MM-DD"
    const end = searchParams.get("end");     // "YYYY-MM-DD"

    if (!start || !end) {
      return NextResponse.json({ message: "Parámetros start y end son requeridos (YYYY-MM-DD)" }, { status: 400 });
    }

    // Normaliza a todo el día (local → Date)
    const startDate = new Date(`${start}T00:00:00.000`);
    const endDate = new Date(`${end}T23:59:59.999`);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ message: "Fechas inválidas" }, { status: 400 });
    }

    if (startDate > endDate) {
      return NextResponse.json({ message: "La fecha inicio no puede ser mayor que la fecha fin" }, { status: 400 });
    }

    const items = await db.historial_movimientos.findMany({
      where: { fechaMovimiento: { gte: startDate, lte: endDate } },
      orderBy: { fechaMovimiento: "desc" },
      include: {
        usuarioReportado: { select: { nombre: true, id: true } },
      },
    });

    return NextResponse.json({ items, count: items.length, start, end });
  } catch (error) {
    console.error("Error en historial-reporte:", error);
    return new NextResponse("Error interno", { status: 500 });
  }
}
