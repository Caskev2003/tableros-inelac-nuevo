import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const codigo = searchParams.get("codigo");
  const noLote = searchParams.get("noParte");

  try {
    let quimico = null;

    if (codigo) {
      quimico = await db.quimicos.findUnique({
        where: { codigo: parseInt(codigo) }
      });
    } else if (noLote) {
      quimico = await db.quimicos.findFirst({
        where: { noLote }
      });
    }

    if (!quimico) {
      return new NextResponse("quimico no encontrado", { status: 404 });
    }

    return NextResponse.json(quimico);
  } catch (error) {
    console.error("Error al buscar quimico:", error);
    return new NextResponse("Error interno", { status: 500 });
  }
}
