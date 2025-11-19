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
  unidadMedidaId: Unidad_medida | string;
  ubicacionId: number;
  existenciaFisica: number;   // ← TOTAL física (disponible + retenidos)
  existenciaSistema: number;
  retenidos: number;
  reportadoPorId: number;
  productoLiberado: string; // "SI" | "NO"
  diasDeVida?: number;
}

// Convierte ISO/“YYYY-MM-DD” a Date UTC 12:00
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

// Días de vida = vencimiento - HOY
const calcDiasDeVida = (fechaVenc: Date) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diff = fechaVenc.getTime() - hoy.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export async function PUT(request: Request) {
  try {
    const body: QuimicoPayload = await request.json();

    // Validaciones mínimas
    if (!body.codigo || body.codigo < 1)
      return NextResponse.json({ success: false, error: "Código inválido" }, { status: 400 });
    if (!body.noLote)
      return NextResponse.json({ success: false, error: "Número de lote requerido" }, { status: 400 });

    const quimicoExistente = await db.quimicos.findFirst({
      where: { codigo: body.codigo, noLote: body.noLote },
    });
    if (!quimicoExistente)
      return NextResponse.json({ success: false, error: "Químico no encontrado" }, { status: 404 });

    // Fechas
    const fechaIngreso = parseFechaLocal(body.fechaIngreso);
    const fechaVencimiento = parseFechaLocal(body.fechaVencimiento);
    if (fechaVencimiento <= fechaIngreso)
      return NextResponse.json(
        { success: false, error: "La fecha de vencimiento debe ser posterior a la de ingreso" },
        { status: 400 }
      );

    // Unidad de medida (normaliza string → enum)
    const unidadesValidas = Object.values(Unidad_medida);
    const unidadNorm = (body.unidadMedidaId ?? "").toString().trim().toUpperCase() as Unidad_medida;
    if (!unidadesValidas.includes(unidadNorm))
      return NextResponse.json(
        { success: false, error: `Unidad de medida inválida. Válidas: ${unidadesValidas.join(", ")}` },
        { status: 400 }
      );

    // Ubicación
    if (!body.ubicacionId || body.ubicacionId < 1)
      return NextResponse.json({ success: false, error: "Ubicación inválida" }, { status: 400 });

    // Existencias (valores totales recibidos)
    if (!Number.isFinite(body.existenciaFisica) || body.existenciaFisica < 0)
      return NextResponse.json({ success: false, error: "Existencia física inválida" }, { status: 400 });
    if (!Number.isFinite(body.existenciaSistema) || body.existenciaSistema < 0)
      return NextResponse.json({ success: false, error: "Existencia en sistema inválida" }, { status: 400 });

    // Producto liberado
    const liberadoNorm = String(body.productoLiberado).toUpperCase();
    if (!["SI", "NO"].includes(liberadoNorm))
      return NextResponse.json({ success: false, error: "Producto liberado debe ser 'SI' o 'NO'" }, { status: 400 });

    // Retenidos
    if (!Number.isFinite(body.retenidos) || body.retenidos < 0)
      return NextResponse.json({ success: false, error: "Retenidos inválidos" }, { status: 400 });

    // 🔹 LÓGICA NUEVA: interpretar existenciaFisica como TOTAL y restar retenidos
    const totalFisico = body.existenciaFisica;
    const totalRetenidos = body.retenidos;

    if (totalRetenidos > totalFisico) {
      return NextResponse.json(
        {
          success: false,
          error: "Los retenidos no pueden ser mayores que la existencia física total",
        },
        { status: 400 }
      );
    }

    // existencia física disponible = total físico - retenidos
    const existenciaFisicaDisponible = totalFisico - totalRetenidos;

    // Cálculos
    const diasDeVida = body.diasDeVida ?? calcDiasDeVida(fechaVencimiento);
    const diferencias = Math.abs(existenciaFisicaDisponible - body.existenciaSistema);

    // Actualización + historial en transacción
    const quimicoActualizado = await db.$transaction(async (tx) => {
      const q = await tx.quimicos.update({
        where: { id: quimicoExistente.id },
        data: {
          descripcion: body.descripcion,
          proveedores: body.proveedores,
          fechaIngreso,
          fechaVencimiento,
          diasDeVida,
          // 🔹 Guardamos la existencia física disponible, no el total
          existenciaFisica: existenciaFisicaDisponible,
          existenciaSistema: body.existenciaSistema,
          diferencias,
          retenidos: totalRetenidos,
          productoLiberado: liberadoNorm,
          unidadMedidaId: unidadNorm,
          ubicacion: { connect: { id: body.ubicacionId } },
          usuarioReportado: { connect: { id: body.reportadoPorId } },
          movimiento: Movimiento.EDITADO,
        },
        include: {
          ubicacion: true,
          usuarioReportado: { select: { nombre: true, rol: true } },
        },
      });

      // Historial (usa campos correctos del schema)
      await tx.historial_movimientos.create({
        data: {
          codigo: q.codigo,
          descripcion: `Edición: ${q.descripcion}`,
          noParte: q.noLote,
          movimiento: Movimiento.EDITADO,
          // 🔹 Registramos la existencia física disponible después de la edición
          cantidad: existenciaFisicaDisponible,
          existenciaFisicaDespues: existenciaFisicaDisponible,
          reportadoPorId: q.reportadoPorId,
          fechaMovimiento: new Date(),
          // marca de almacén para químicos
          almacenEnum: "QUIMICOS",
          almacenText: "Almacén de Químicos",
        },
      } as any);

      return q;
    });

    return NextResponse.json({
      success: true,
      data: quimicoActualizado,
      message: "Químico actualizado correctamente",
    });
  } catch (error: any) {
    console.error("Error en PUT /api/quimicos/update:", error);
    return NextResponse.json({ success: false, error: error?.message || "Error interno" }, { status: 500 });
  }
}
