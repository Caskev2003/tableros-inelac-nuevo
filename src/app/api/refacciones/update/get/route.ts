import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const codigo = Number(searchParams.get("codigo"));

  if (isNaN(codigo)) {
    return new NextResponse("Código inválido", { status: 400 });
  }

  try {
    const refaccion = await db.refacciones_l3.findUnique({
      where: { codigo },
      include: {
        ubicacion: true,
        usuarioReportado: true,
      },
    });

    if (!refaccion) {
      return new NextResponse("Refacción no encontrada", { status: 404 });
    }

    return NextResponse.json(refaccion);
  } catch (error) {
    console.error("Error en GET refacción:", error);
    return new NextResponse("Error interno", { status: 500 });
  }
}