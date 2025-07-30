import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ubicaciones = await db.ubicacion.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        rack: true,
        posicion: true,
        fila: true
      }
    });

    return NextResponse.json(ubicaciones);
  } catch (error) {
    console.error("Error al obtener ubicaciones:", error);
    return NextResponse.json(
      { error: "No se pudieron cargar las ubicaciones" },
      { status: 500 }
    );
  }
}

// Opcional: Si necesitas el método POST para crear ubicaciones
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rack, posicion, fila } = body;

    const nuevaUbicacion = await db.ubicacion.create({
      data: { rack, posicion, fila },
      select: {
        id: true,
        rack: true,
        posicion: true,
        fila: true
      }
    });

    return NextResponse.json(nuevaUbicacion, { status: 201 });
  } catch (error) {
    console.error("Error al crear ubicación:", error);
    return NextResponse.json(
      { error: "Error al crear ubicación" },
      { status: 500 }
    );
  }
}