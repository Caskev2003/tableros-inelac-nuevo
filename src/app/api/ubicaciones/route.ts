// src/app/api/ubicaciones/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ubicacionSchema = z.object({
  rack: z.coerce.number().int().min(1, "Rack debe ser >= 1"),
  posicion: z.string().trim().min(1),
  fila: z.string().trim().min(1),
});

export async function GET() {
  try {
    const ubicaciones = await db.ubicacion.findMany({
      orderBy: { id: "asc" },
      select: { id: true, rack: true, posicion: true, fila: true },
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ubicacionSchema.parse({
      rack: body?.rack,
      posicion: String(body?.posicion || "").toUpperCase(), // opcional: normalizar
      fila: String(body?.fila || "").toUpperCase(),         // opcional: normalizar
    });

    const nuevaUbicacion = await db.ubicacion.create({
      data: parsed,
      select: { id: true, rack: true, posicion: true, fila: true },
    });

    // 👇 Esto es lo que espera el modal para autoseleccionar
    return NextResponse.json(nuevaUbicacion, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear ubicación:", error);
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al crear ubicación" },
      { status: 500 }
    );
  }
}
