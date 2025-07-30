import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query");

  if (!query || isNaN(Number(query))) {
    return NextResponse.json([]);
  }

  const codigoInt = parseInt(query);

  try {
    const resultados = await db.historial_movimientos.findMany({
      where: {
        codigoRefaccion: {
          gte: codigoInt,
        },
      },
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
      item.codigoRefaccion.toString().startsWith(query)
    );

    return NextResponse.json(filtrados);
  } catch (error) {
    console.error("Error al buscar en historial por código:", error);
    return new NextResponse("INTERNAL ERROR", { status: 500 });
  }
}
