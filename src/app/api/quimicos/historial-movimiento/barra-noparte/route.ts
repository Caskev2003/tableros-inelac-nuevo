import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query");

  if (!query) return NextResponse.json([]);

  try {
    const resultados = await db.historial_movimientos.findMany({
      orderBy: { fechaMovimiento: "desc" },
      include: {
        usuarioReportado: {
          select: {
            nombre: true,
          },
        },
      },
    });

    const filtrados = resultados.filter((item) =>
      item.noParte.toLowerCase().includes(query.toLowerCase())
    );

    return NextResponse.json(filtrados);
  } catch (error) {
    console.error("Error al buscar en historial por número de parte:", error);
    return new NextResponse("INTERNAL ERROR", { status: 500 });
  }
}
