import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get("pageSize") || "20", 10), 1),
      200
    );
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [total, items] = await Promise.all([
      db.historial_movimientos.count(),
      db.historial_movimientos.findMany({
        orderBy: { fechaMovimiento: "desc" },
        include: {
          usuarioReportado: { select: { nombre: true, id: true } },
        },
        skip,
        take,
      }),
    ]);

    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    return NextResponse.json({ items, total, page, pageSize, totalPages });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    return new NextResponse("Error interno", { status: 500 });
  }
}
