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

type UbicacionRow = { id: number; rack: number; posicion: string; fila: string };

export async function GET() {
  try {
    const ubicaciones = await db.$queryRaw<UbicacionRow[]>`
      SELECT id, rack, posicion, fila
      FROM ubicacion
      WHERE rack BETWEEN 1 AND 26
      ORDER BY
        rack ASC,
        FIELD(UPPER(posicion), 'A','B','C','D','PISO'),
        /* si 'fila' es numérica en texto, ordénala como número */
        CASE
          WHEN fila REGEXP '^[0-9]+$' THEN CAST(fila AS UNSIGNED)
          ELSE fila
        END ASC
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
      posicion: String(body?.posicion || "").toUpperCase(), // normaliza
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
