import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { Movimiento } from "@prisma/client";

export async function PUT(req: Request, { params }: { params: { codigo: string } }) {
  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const codigo = parseInt(params.codigo);
  
  if (isNaN(codigo)) {
    return new NextResponse("Código inválido", { status: 400 });
  }

  const { tipo, cantidad, nuevaExistencia, nuevasDiferencias } = await req.json();

  if (!["ENTRADA", "SALIDA"].includes(tipo)) {
    return new NextResponse("Tipo de movimiento inválido", { status: 400 });
  }

  try {
    // 1. Actualizar el químico
    const updated = await db.quimicos.update({
      where: { codigo },
      data: {
        existenciaFisica: nuevaExistencia,
        diferencias: nuevasDiferencias,
        movimiento: tipo as Movimiento,
        cantidadEntrada: tipo === "ENTRADA" ? cantidad : 0,
        cantidadSalida: tipo === "SALIDA" ? cantidad : 0,
        cantidad: nuevaExistencia
      },
      include: {
        ubicacion: true
      }
    });

    // 2. Registrar en el historial
    await db.historial_movimientos.create({
      data: {
        codigoRefaccion: updated.codigo,
        descripcion: updated.descripcion,
        noParte: updated.noLote, // Cambiado de noParte a noLote
        movimiento: tipo as Movimiento,
        cantidad,
        existenciaFisicaDespues: nuevaExistencia,
        reportadoPorId: Number(session.user.id),
      },
    });

    // 3. Crear notificación si la existencia llega a 0
    if (nuevaExistencia === 0) {
      await db.notificacion_refaccion.create({
        data: {
          codigo: updated.codigo,
          descripcion: `QUÍMICO AGOTADO: ${updated.descripcion}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Movimiento de ${tipo.toLowerCase()} registrado correctamente`
    });

  } catch (error) {
    console.error("Error al actualizar químico:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}