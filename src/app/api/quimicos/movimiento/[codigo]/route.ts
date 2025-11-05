import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { Movimiento } from "@prisma/client";

export async function PUT(req: Request, { params }: { params: { codigo: string } }) {
  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const codigo = parseInt(params.codigo, 10);
  if (Number.isNaN(codigo)) {
    return new NextResponse("Código inválido", { status: 400 });
  }

  const { tipo, cantidad, noLote } = await req.json();

  if (!["ENTRADA", "SALIDA"].includes(tipo)) {
    return new NextResponse("Tipo de movimiento inválido", { status: 400 });
  }
  if (!noLote) {
    return new NextResponse("No. de lote requerido", { status: 400 });
  }
  if (cantidad <= 0) {
    return new NextResponse("Cantidad > 0 requerida", { status: 400 });
  }

  try {
    // 1) Buscar el químico por la UNIQUE compuesta (codigo,noLote)
    const quimico = await db.quimicos.findUnique({
      where: { quimicos_codigo_noLote_unique: { codigo, noLote } },
    });
    if (!quimico) {
      return new NextResponse("Químico no encontrado", { status: 404 });
    }

    // 2) Calcular nueva existencia y diferencias
    let nuevaExistencia = quimico.existenciaFisica;
    if (tipo === "ENTRADA") {
      nuevaExistencia += cantidad;
    } else {
      if (quimico.existenciaFisica < cantidad) {
        return new NextResponse("No hay suficiente stock para salida", { status: 400 });
      }
      nuevaExistencia -= cantidad;
    }
    const nuevasDiferencias = Math.abs(nuevaExistencia - quimico.existenciaSistema);

    // 3) Actualizar químico (QUITAMOS 'cantidad' porque no existe en el modelo)
    const updated = await db.quimicos.update({
      where: { id: quimico.id },
      data: {
        existenciaFisica: nuevaExistencia,
        diferencias: nuevasDiferencias,
        movimiento: tipo as Movimiento,
        cantidadEntrada: tipo === "ENTRADA" ? cantidad : 0,
        cantidadSalida: tipo === "SALIDA" ? cantidad : 0,
        reportadoPorId: Number(session.user.id),
      },
      include: { ubicacion: true },
    });

    // 4) Registrar historial (usa 'codigo' y 'almacenText' según tu schema)
    await db.historial_movimientos.create({
      data: {
        codigo: updated.codigo,
        descripcion: updated.descripcion,
        noParte: updated.noLote,              // guardamos el lote en 'noParte'
        movimiento: tipo as Movimiento,
        cantidad,
        existenciaFisicaDespues: nuevaExistencia,
        reportadoPorId: Number(session.user.id),
        almacenText: "QUIMICOS",              // requerido en tu modelo
        // almacenEnum: Almacen.QUIMICOS,     // opcional si quieres llenar el enum
      },
    });

    // 5) Notificación si queda en 0
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
  } catch (error: any) {
    console.error("Error al actualizar químico:", error);
    return new NextResponse(error?.message ?? "Error interno del servidor", { status: 500 });
  }
}
