// src/app/api/quimicos/update/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Movimiento, Unidad_medida } from "@prisma/client";

interface QuimicoPayload {
  codigo: number;
  descripcion: string;
  noLote: string;
  proveedores: string;
  fechaIngreso: string;
  fechaVencimiento: string;
  unidadMedidaId: Unidad_medida;
  ubicacionId: number;
  existenciaFisica: number;
  existenciaSistema: number;
  retenidos: number;
  reportadoPorId: number;
  productoLiberado: string;
  diasDeVida?: number;
}

// Convierte cualquier fecha ISO o YYYY-MM-DD a Date UTC mediodía
const parseFechaLocal = (fechaStr: string): Date => {
  if (!fechaStr) throw new Error("Fecha vacía");

  let fecha = new Date(fechaStr);
  if (!isNaN(fecha.getTime())) {
    return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate(), 12, 0, 0));
  }

  const partes = fechaStr.split("-").map(Number);
  if (partes.length !== 3) throw new Error("Fecha inválida: " + fechaStr);
  const [year, month, day] = partes;
  fecha = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (isNaN(fecha.getTime())) throw new Error("Fecha inválida: " + fechaStr);
  return fecha;
};

export async function PUT(request: Request) {
  try {
    const body: QuimicoPayload = await request.json();

    // Validación básica
    if (!body.codigo || body.codigo < 1) return NextResponse.json({ success: false, error: "Código inválido" }, { status: 400 });
    if (!body.noLote) return NextResponse.json({ success: false, error: "Número de lote requerido" }, { status: 400 });

    const quimicoExistente = await db.quimicos.findFirst({
      where: { codigo: body.codigo, noLote: body.noLote },
    });
    if (!quimicoExistente) return NextResponse.json({ success: false, error: "Químico no encontrado" }, { status: 404 });

    // Parseo de fechas
    const fechaIngreso = parseFechaLocal(body.fechaIngreso);
    const fechaVencimiento = parseFechaLocal(body.fechaVencimiento);

    if (fechaVencimiento <= fechaIngreso)
      return NextResponse.json({ success: false, error: "La fecha de vencimiento debe ser posterior a la de ingreso" }, { status: 400 });

    // Validación de unidad
    const unidadesValidas = Object.values(Unidad_medida);
    if (!body.unidadMedidaId || !unidadesValidas.includes(body.unidadMedidaId))
      return NextResponse.json({ success: false, error: `Unidad de medida inválida: ${unidadesValidas.join(", ")}` }, { status: 400 });

    // Validación de ubicación
    if (!body.ubicacionId || body.ubicacionId < 1)
      return NextResponse.json({ success: false, error: "Ubicación inválida" }, { status: 400 });

    // Validación de existencias
    if (body.existenciaFisica < 0 || body.existenciaFisica > 9999)
      return NextResponse.json({ success: false, error: "Existencia física inválida" }, { status: 400 });
    if (body.existenciaSistema < 0 || body.existenciaSistema > 9999)
      return NextResponse.json({ success: false, error: "Existencia en sistema inválida" }, { status: 400 });

    // Validación de producto liberado
    if (!["SI", "NO"].includes(body.productoLiberado))
      return NextResponse.json({ success: false, error: "Producto liberado debe ser 'SI' o 'NO'" }, { status: 400 });

    // Validación de retenidos
    if (body.retenidos < 0 || body.retenidos > 9999)
      return NextResponse.json({ success: false, error: "Retenidos inválidos" }, { status: 400 });

    // Calcular días de vida
    const diasDeVida = body.diasDeVida || Math.ceil((fechaVencimiento.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24));
    const diferencias = Math.abs(body.existenciaFisica - body.existenciaSistema);

    // Actualizar químico
    const quimicoActualizado = await db.quimicos.update({
      where: { id: quimicoExistente.id },
      data: {
        descripcion: body.descripcion,
        proveedores: body.proveedores,
        fechaIngreso,
        fechaVencimiento,
        diasDeVida,
        existenciaFisica: body.existenciaFisica,
        existenciaSistema: body.existenciaSistema,
        diferencias,
        retenidos: body.retenidos,
        productoLiberado: body.productoLiberado,
        unidadMedidaId: body.unidadMedidaId,
        ubicacion: { connect: { id: body.ubicacionId } },
        usuarioReportado: { connect: { id: body.reportadoPorId } },
        movimiento: "EDITADO" as Movimiento,
      },
      include: {
        ubicacion: true,
        usuarioReportado: { select: { nombre: true, rol: true } },
      },
    });

    // Registrar historial
    await db.historial_movimientos.create({
      data: {
        codigoRefaccion: quimicoActualizado.codigo,
        descripcion: `Edición: ${quimicoActualizado.descripcion}`,
        noParte: quimicoActualizado.noLote,
        movimiento: "EDITADO" as Movimiento,
        cantidad: quimicoActualizado.existenciaFisica,
        existenciaFisicaDespues: quimicoActualizado.existenciaFisica,
        reportadoPorId: quimicoActualizado.reportadoPorId,
        fechaMovimiento: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: quimicoActualizado,
      message: "Químico actualizado correctamente",
    });
  } catch (error: any) {
    console.error("Error en PUT /api/quimicos/update:", error);
    return NextResponse.json({ success: false, error: error.message || "Error interno" }, { status: 500 });
  }
}
