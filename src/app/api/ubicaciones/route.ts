// src/app/api/ubicaciones/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Prisma NO en Edge

const ubicacionSchema = z.object({
  rack: z.coerce.number().int().min(1, "Rack debe ser >= 1"),
  posicion: z.string().trim().min(1),
  fila: z.string().trim().min(1),
});

type UbicacionRow = { id: number; rack: number; posicion: string; fila: string };

export async function GET() {
  try {
    // ORDER BY: rack ASC, luego A/B/C/D/PISO, luego fila ASC
    const ubicaciones = await db.$queryRaw<UbicacionRow[]>`
      SELECT id, rack, posicion, fila
      FROM ubicacion
      WHERE rack BETWEEN 1 AND 26
      ORDER BY
        rack ASC,
        CASE UPPER(posicion)
          WHEN 'A'   THEN 1
          WHEN 'B'   THEN 2
          WHEN 'C'   THEN 3
          WHEN 'D'   THEN 4
          WHEN 'PISO' THEN 5
          ELSE 6
        END,
        fila ASC
    `;

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
      posicion: String(body?.posicion || "").toUpperCase(),
      fila: String(body?.fila || "").toUpperCase(),
    });

    const nuevaUbicacion = await db.ubicacion.create({
      data: parsed,
      select: { id: true, rack: true, posicion: true, fila: true },
    });

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
