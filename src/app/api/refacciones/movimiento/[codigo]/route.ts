import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";

export async function PUT(req: Request, { params }: { params: { codigo: string } }) {
  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const codigo = parseInt(params.codigo, 10);
  const { tipo, cantidad, nuevaExistencia, nuevasDiferencias } = await req.json();

  if (!["ENTRADA", "SALIDA"].includes(tipo)) {
    return new NextResponse("Tipo de movimiento inválido", { status: 400 });
  }

  const data: any = {
    existenciaFisica: nuevaExistencia,
    diferencias: nuevasDiferencias,
    movimiento: tipo,
    cantidadEntrada: tipo === "ENTRADA" ? cantidad : 0,
    cantidadSalida: tipo === "SALIDA" ? cantidad : 0,
  };

  // Actualiza refacción
  const updated = await db.refacciones_l3.update({
    where: { codigo },
    data,
  });

  // Inserta historial (usa 'codigo' y 'almacenText' requeridos en tu schema)
  await db.historial_movimientos.create({
    data: {
      codigo: updated.codigo,
      descripcion: updated.descripcion,
      noParte: updated.noParte,
      movimiento: tipo, // enum Movimiento
      cantidad,
      existenciaFisicaDespues: nuevaExistencia,
      reportadoPorId: Number(session.user.id),
      almacenText: "REFACCIONES",       
    },
  });

  // Notificación si llegó a 0
  if (nuevaExistencia === 0) {
    await db.notificacion_refaccion.create({
      data: {
        codigo: updated.codigo,
        descripcion: updated.descripcion,
      },
    });
  }

  return NextResponse.json(updated);
}
