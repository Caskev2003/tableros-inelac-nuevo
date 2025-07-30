import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";

  // Determina si el filtro es un número (parcial o completo)
  const isNumeric = /^\d+$/.test(q);

  const resultados = await db.refacciones_l3.findMany({
    where: isNumeric
      ? {
          codigo: {
            gte: Number(q) // puedes usar contains si es string
          }
        }
      : {}, // cuando q está vacío, traer todos
    select: {
      codigo: true,
      descripcion: true
    },
    orderBy: {
      codigo: "asc"
    },
    take: 100 // máximo 100 resultados (ajustable)
  });

  const codigos = resultados.map((r) => ({
    codigo: r.codigo.toString(),
    descripcion: r.descripcion
  }));

  return NextResponse.json(codigos);
}
