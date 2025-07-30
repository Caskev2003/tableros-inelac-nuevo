import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Buscar todos los productos que actualmente están en existencia 0
    const productosSinExistencia = await db.refacciones_l3.findMany({
      where: {
        existenciaFisica: 0,
      },
      select: {
        codigo: true,
        descripcion: true,
      },
    });

    // Transformar a formato de notificación
    const notificaciones = productosSinExistencia.map((producto, index) => ({
      id: index + 1, // temporal para frontend
      codigo: producto.codigo,
      descripcion: producto.descripcion,
      creadaEn: new Date().toISOString(),
    }));

    return NextResponse.json(notificaciones);
  } catch (error) {
    console.error("Error al obtener todas las notificaciones:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
