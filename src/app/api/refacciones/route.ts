// src/app/api/refacciones/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/* ------------------------------ utilidades ------------------------------ */
// Parseo flexible: YYYY-MM-DD, DD/MM/YYYY o ISO
function parseFechaFlexible(s: string) {
  if (!s) return NaN;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T12:00:00`).getTime();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split("/");
    return new Date(`${yyyy}-${mm}-${dd}T12:00:00`).getTime();
  }
  return new Date(s).getTime();
}

/* --------------------------------- POST ---------------------------------- */
/** Registrar refacción (NUEVO_INGRESO) */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      codigo,
      descripcion,
      noParte,
      fechaIngreso,
      proveedores,
      unidadMedidaId,
      ubicacionId,
      reportadoPorId,
      existenciaSistema,
      existenciaFisica, // opcional en UI
      cantidad,         // fallback si no viene existenciaFisica
    } = body ?? {};

    // Coerciones
    const parsedCodigo = Number(codigo);
    const parsedUbicacionId = Number(ubicacionId);
    const parsedReportadoPorId = Number(reportadoPorId);
    const parsedExistenciaSistema = Number(existenciaSistema);
    const parsedExistenciaFisica = Number(existenciaFisica ?? cantidad ?? NaN);
    const unidadNorm = (unidadMedidaId ?? "").toString().trim().toUpperCase();

    // Validaciones mínimas
    const faltantes: string[] = [];
    if (!Number.isFinite(parsedCodigo)) faltantes.push("codigo");
    if (!descripcion) faltantes.push("descripcion");
    if (!noParte) faltantes.push("noParte");
    if (!fechaIngreso) faltantes.push("fechaIngreso");
    if (!proveedores) faltantes.push("proveedores");
    if (!unidadNorm) faltantes.push("unidadMedidaId");
    if (!Number.isFinite(parsedUbicacionId)) faltantes.push("ubicacionId");
    if (!Number.isFinite(parsedReportadoPorId)) faltantes.push("reportadoPorId");
    if (!Number.isFinite(parsedExistenciaSistema)) faltantes.push("existenciaSistema");
    if (!Number.isFinite(parsedExistenciaFisica)) faltantes.push("existenciaFisica (o cantidad)");

    if (faltantes.length) {
      return NextResponse.json(
        { error: "Datos faltantes o inválidos", fields: faltantes },
        { status: 400 }
      );
    }

    const msIngreso = parseFechaFlexible(String(fechaIngreso));
    if (!Number.isFinite(msIngreso)) {
      return NextResponse.json({ error: "Fecha de ingreso inválida" }, { status: 400 });
    }
    const parsedFechaIngreso = new Date(msIngreso);

    // Unicidad por código
    const yaExiste = await db.refacciones_l3.findUnique({
      where: { codigo: parsedCodigo },
      select: { codigo: true },
    });
    if (yaExiste) {
      return NextResponse.json({ error: "Duplicado: código ya existe" }, { status: 409 });
    }

    const diferencias = Math.abs(parsedExistenciaFisica - parsedExistenciaSistema);

    const creado = await db.$transaction(async (tx) => {
      const nuevo = await tx.refacciones_l3.create({
        data: {
          codigo: parsedCodigo,
          descripcion,
          noParte,
          fechaIngreso: parsedFechaIngreso,
          proveedores,
          unidadMedidaId: unidadNorm as any,
          existenciaFisica: parsedExistenciaFisica,
          existenciaSistema: parsedExistenciaSistema,
          diferencias,
          cantidadEntrada: parsedExistenciaFisica,
          cantidadSalida: 0,
          movimiento: "NUEVO_INGRESO",
          ubicacion: { connect: { id: parsedUbicacionId } },
          usuarioReportado: { connect: { id: parsedReportadoPorId } },
        },
      });

      // historial_movimientos (nueva estructura)
      await tx.historial_movimientos.create({
        data: {
          codigo: nuevo.codigo,
          descripcion: nuevo.descripcion,
          noParte: nuevo.noParte,
          movimiento: "NUEVO_INGRESO",
          cantidad: parsedExistenciaFisica,
          existenciaFisicaDespues: parsedExistenciaFisica,
          reportadoPorId: parsedReportadoPorId,
          almacenEnum: "REFACCIONES",
          almacenText: "Almacén de Refacciones",
        },
      });

      return nuevo;
    });

    return NextResponse.json(
      { success: true, message: "Refacción registrada", data: creado },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("❌ POST /refacciones:", err);
    return NextResponse.json({ error: "INTERNAL ERROR", detail: err?.message }, { status: 500 });
  }
}

/* ---------------------------------- GET ---------------------------------- */
/** Listar refacciones o traer una por código (?codigo=123) */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const codigo = searchParams.get("codigo");

    if (codigo) {
      const item = await db.refacciones_l3.findUnique({
        where: { codigo: Number(codigo) },
        include: {
          ubicacion: true,
          usuarioReportado: { select: { nombre: true, rol: true } },
        },
      });
      if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      return NextResponse.json(item);
    }

    const limit = Number(searchParams.get("limit")) || undefined;
    const offset = Number(searchParams.get("offset")) || 0;

    const list = await db.refacciones_l3.findMany({
      include: {
        ubicacion: true,
        usuarioReportado: { select: { nombre: true, rol: true } },
      },
      orderBy: { fechaIngreso: "desc" },
      take: limit,
      skip: offset,
    });

    return NextResponse.json(list);
  } catch (err: any) {
    console.error("❌ GET /refacciones:", err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}

/* ---------------------------------- PUT ---------------------------------- */
/** Editar refacción existente por código (cuerpo JSON) */
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const {
      codigo,                // requerido para ubicar registro
      descripcion,
      noParte,
      fechaIngreso,          // opcional: si viene, se actualiza
      proveedores,
      unidadMedidaId,
      ubicacionId,
      reportadoPorId,        // quien edita / reporta
      existenciaSistema,
      existenciaFisica,
    } = body ?? {};

    const parsedCodigo = Number(codigo);
    if (!Number.isFinite(parsedCodigo)) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    const existente = await db.refacciones_l3.findUnique({
      where: { codigo: parsedCodigo },
    });
    if (!existente) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    // Parseos opcionales
    const parsedUbicacionId = Number.isFinite(Number(ubicacionId)) ? Number(ubicacionId) : undefined;
    const parsedReportadoPorId = Number.isFinite(Number(reportadoPorId))
      ? Number(reportadoPorId)
      : existente.reportadoPorId;

    const parsedExistenciaSistema =
      existenciaSistema !== undefined ? Number(existenciaSistema) : existente.existenciaSistema;

    const parsedExistenciaFisica =
      existenciaFisica !== undefined ? Number(existenciaFisica) : existente.existenciaFisica;

    const unidadNorm = unidadMedidaId
      ? (unidadMedidaId as string).toString().trim().toUpperCase()
      : existente.unidadMedidaId;

    let parsedFechaIngreso: Date | undefined = undefined;
    if (fechaIngreso) {
      const ms = parseFechaFlexible(String(fechaIngreso));
      if (!Number.isFinite(ms)) {
        return NextResponse.json({ error: "Fecha de ingreso inválida" }, { status: 400 });
      }
      parsedFechaIngreso = new Date(ms);
    }

    const diferencias = Math.abs(parsedExistenciaFisica - parsedExistenciaSistema);

    const actualizado = await db.$transaction(async (tx) => {
      const upd = await tx.refacciones_l3.update({
        where: { codigo: parsedCodigo },
        data: {
          descripcion: descripcion ?? existente.descripcion,
          noParte: noParte ?? existente.noParte,
          proveedores: proveedores ?? existente.proveedores,
          unidadMedidaId: (unidadNorm as any) ?? existente.unidadMedidaId,
          fechaIngreso: parsedFechaIngreso ?? existente.fechaIngreso,
          existenciaFisica: parsedExistenciaFisica,
          existenciaSistema: parsedExistenciaSistema,
          diferencias,
          movimiento: "EDITADO",
          ...(parsedUbicacionId ? { ubicacion: { connect: { id: parsedUbicacionId } } } : {}),
          usuarioReportado: { connect: { id: parsedReportadoPorId } },
        },
      });

      await tx.historial_movimientos.create({
        data: {
          codigo: upd.codigo,
          descripcion: `Edición: ${upd.descripcion}`,
          noParte: upd.noParte,
          movimiento: "EDITADO",
          cantidad: parsedExistenciaFisica,
          existenciaFisicaDespues: parsedExistenciaFisica,
          reportadoPorId: parsedReportadoPorId,
          fechaMovimiento: new Date(),
          almacenEnum: "REFACCIONES",
          almacenText: "Almacén de Refacciones",
        },
      });

      return upd;
    });

    return NextResponse.json({
      success: true,
      message: "Refacción actualizada",
      data: actualizado,
    });
  } catch (err: any) {
    console.error("❌ PUT /refacciones:", err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}

/* -------------------------------- DELETE --------------------------------- */
/** Eliminar refacción por ?codigo=123 o en body { codigo } */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let codigo = searchParams.get("codigo");

    if (!codigo) {
      try {
        const body = await request.json();
        codigo = body?.codigo;
      } catch {
        /* ignore */ 
      }
    }

    if (!codigo) {
      return NextResponse.json({ error: "Se requiere código" }, { status: 400 });
    }

    const existente = await db.refacciones_l3.findUnique({
      where: { codigo: Number(codigo) },
    });
    if (!existente) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await db.$transaction(async (tx) => {
      await tx.historial_movimientos.create({
        data: {
          codigo: existente.codigo,
          descripcion: existente.descripcion,
          noParte: existente.noParte,
          movimiento: "ELIMINADO",
          cantidad: existente.existenciaFisica,
          existenciaFisicaDespues: 0,
          reportadoPorId: existente.reportadoPorId,
          fechaMovimiento: new Date(),
          almacenEnum: "REFACCIONES",
          almacenText: "Almacén de Refacciones",
        },
      });

      await tx.refacciones_l3.delete({ where: { codigo: existente.codigo } });
    });

    return NextResponse.json({
      success: true,
      message: "Refacción eliminada",
      data: { codigo: Number(codigo) },
    });
  } catch (err: any) {
    console.error("❌ DELETE /refacciones:", err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}
