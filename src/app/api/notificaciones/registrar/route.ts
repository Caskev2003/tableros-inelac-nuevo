import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!Array.isArray(data)) {
      return NextResponse.json({ message: "Formato inválido" }, { status: 400 });
    }

    const insertados = [];

    for (const item of data) {
      const existe = await db.notificacion_refaccion.findFirst({
        where: {
          codigo: item.codigo,
          creadaEn: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // últimas 24h
          }
        }
      });

      if (!existe) {
        const nueva = await db.notificacion_refaccion.create({
          data: {
            codigo: item.codigo,
            descripcion: item.descripcion,
          }
        });
        insertados.push(nueva);
      }
    }

    return NextResponse.json({ insertados });
  } catch (error) {
    console.error("Error al registrar notificaciones:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
