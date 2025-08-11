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

  const { tipo, cantidad, noLote } = await req.json();

  if (!["ENTRADA", "SALIDA"].includes(tipo)) {
    return new NextResponse("Tipo de movimiento inválido", { status: 400 });
  }

  if (!noLote) {
    return new NextResponse("No. de lote requerido", { status: 400 });
  }

  try {
    // 1. Buscar el químico específico
    const quimico = await db.quimicos.findFirst({
      where: { codigo, noLote },
    });

    if (!quimico) {
      return new NextResponse("Químico no encontrado", { status: 404 });
    }

    // 2. Calcular nueva existencia y diferencias
    let nuevaExistencia = quimico.existenciaFisica;
    if (tipo === "ENTRADA") {
      nuevaExistencia += cantidad;
    } else if (tipo === "SALIDA") {
      if (quimico.existenciaFisica < cantidad) {
        return new NextResponse("No hay suficiente stock para salida", { status: 400 });
      }
      nuevaExistencia -= cantidad;
    }

    const nuevasDiferencias = Math.abs(nuevaExistencia - quimico.existenciaSistema);

    // 3. Actualizar el químico
    const updated = await db.quimicos.update({
      where: { id: quimico.id },
      data: {
        existenciaFisica: nuevaExistencia,
        diferencias: nuevasDiferencias,
        movimiento: tipo as Movimiento,
        cantidadEntrada: tipo === "ENTRADA" ? cantidad : 0,
        cantidadSalida: tipo === "SALIDA" ? cantidad : 0,
        cantidad: nuevaExistencia,
        reportadoPorId: Number(session.user.id),
      },
      include: {
        ubicacion: true,
      },
    });

    // 4. Registrar en historial de movimientos
    await db.historial_movimientos.create({
      data: {
        codigoRefaccion: updated.codigo,
        descripcion: updated.descripcion,
        noParte: updated.noLote,
        movimiento: tipo as Movimiento,
        cantidad,
        existenciaFisicaDespues: nuevaExistencia,
        reportadoPorId: Number(session.user.id),
      },
    });

    // 5. Crear notificación si llega a 0
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
      message: `Movimiento de ${tipo.toLowerCase()} registrado correctamente`,
    });
  } catch (error) {
    console.error("Error al actualizar químico:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
