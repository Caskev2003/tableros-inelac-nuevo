import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const notificaciones = await db.notificacion_refaccion.findMany({
      where: {
        creadaEn: {
          gte: hace24Horas,
        },
      },
      orderBy: {
        creadaEn: "desc",
      },
    });

    return NextResponse.json(notificaciones);
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    return NextResponse.json(
      { error: "Error al cargar notificaciones recientes." },
      { status: 500 }
    );
  }
}
