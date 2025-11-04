// src/app/api/usuarios/get/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "../../../../../auth";

// GET /api/usuarios/get?page=1&pageSize=10
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get("pageSize") || "10", 10), 1),
      100
    );
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [total, items] = await Promise.all([
      db.usuario.count(),
      db.usuario.findMany({
        select: {
          id: true,
          nombre: true,
          correo: true,
          imagen: true,
          rol: true,
          telefono: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return new NextResponse("INTERNAL ERROR", { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    if (!id) return new NextResponse("ID requerido", { status: 400 });

    
    const session = await auth();
    const me = Number(session?.user?.id ?? 0);

    if (me === id) {
      return NextResponse.json(
        { message: "No puedes eliminar tu propia cuenta." },
        { status: 403 }
      );
    }

    // Validar existencia del usuario a eliminar
    const victim = await db.usuario.findUnique({ where: { id } });
    if (!victim) return new NextResponse("Usuario no existe", { status: 404 });

    // Contar referencias
    const [mCount, l3Count, qCount] = await Promise.all([
      db.historial_movimientos.count({ where: { reportadoPorId: id } }),
      db.refacciones_l3.count({ where: { reportadoPorId: id } }),
      db.quimicos.count({ where: { reportadoPorId: id } }),
    ]);
    const totalRefs = mCount + l3Count + qCount;

    // Si no tiene referencias -> borrar directo
    if (totalRefs === 0) {
      await db.usuario.delete({ where: { id } });
      return new NextResponse(null, { status: 204 });
    }

    // Si tiene referencias -> requerir toId
    const toId = Number(url.searchParams.get("toId"));
    if (!toId || toId === id) {
      return NextResponse.json(
        {
          message:
            "No se puede eliminar: tiene registros asociados. Proporciona ?toId=<usuario_destino> para reasignar.",
          detalle: {
            historial_movimientos: mCount,
            refacciones_l3: l3Count,
            quimicos: qCount,
          },
        },
        { status: 409 }
      );
    }

    // Validar usuario destino
    const target = await db.usuario.findUnique({ where: { id: toId } });
    if (!target) return new NextResponse("Usuario destino no existe", { status: 404 });

    // Reasignar TODO y borrar en transacción
    await db.$transaction([
      db.historial_movimientos.updateMany({ where: { reportadoPorId: id }, data: { reportadoPorId: toId } }),
      db.refacciones_l3.updateMany({ where: { reportadoPorId: id }, data: { reportadoPorId: toId } }),
      db.quimicos.updateMany({ where: { reportadoPorId: id }, data: { reportadoPorId: toId } }),
      db.usuario.delete({ where: { id } }),
    ]);

    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    if (e?.code === "P2003") {
      return new NextResponse("No se puede eliminar: faltó reasignar referencias.", { status: 409 });
    }
    console.error("Error eliminando usuario:", e);
    return new NextResponse("INTERNAL ERROR", { status: 500 });
  }
}
