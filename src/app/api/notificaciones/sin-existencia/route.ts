import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // igual que tu uso actual

export const dynamic="force-dynamic"
export async function GET(req: Request) {
  try {
    const productosSinExistencia: any[] = await db.$queryRawUnsafe(`
      SELECT
        codigo,
        descripcion
      FROM refacciones_l3
      WHERE existenciaFisica = 0
    `);

    return NextResponse.json(productosSinExistencia);
  } catch (error) {
    console.error("Error al obtener productos sin existencia", error);
    return NextResponse.json(
      {
        mensaje: "Error al obtener productos sin existencia",
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
