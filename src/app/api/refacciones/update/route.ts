import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    const {
      codigo,
      descripcion,
      noParte,
      fechaIngreso,
      proveedores,
      unidadMedidaId,
      ubicacionId,
      reportadoPorId,
      // UI: cantidad = nueva existencia física que quieres guardar
      cantidad,
      existenciaSistema,
    } = body ?? {}

    const parsedCodigo = Number(codigo)
    const parsedUbicacionId = Number(ubicacionId)
    const parsedReportadoPorId = Number(reportadoPorId)
    const parsedCantidad = Number(cantidad)
    const parsedExistenciaSistema = Number(existenciaSistema)

    // Validaciones mínimas
    if (
      !Number.isFinite(parsedCodigo) ||
      !descripcion ||
      !noParte ||
      !fechaIngreso ||
      !proveedores ||
      !unidadMedidaId ||
      !Number.isFinite(parsedUbicacionId) ||
      !Number.isFinite(parsedReportadoPorId) ||
      !Number.isFinite(parsedCantidad) ||
      !Number.isFinite(parsedExistenciaSistema)
    ) {
      return new NextResponse("Datos faltantes o inválidos", { status: 400 })
    }

    const parsedFecha = new Date(`${fechaIngreso}T12:00:00`)
    if (Number.isNaN(parsedFecha.getTime())) {
      return new NextResponse("Fecha de ingreso inválida", { status: 400 })
    }

    // Verificar que exista la refacción
    const refaccionExistente = await db.refacciones_l3.findUnique({
      where: { codigo: parsedCodigo },
    })
    if (!refaccionExistente) {
      return new NextResponse("Refacción no encontrada", { status: 404 })
    }

    const diferencia = Math.abs(parsedCantidad - parsedExistenciaSistema)

    // Actualizar refacción (nota: refacciones_l3 no tiene campo 'cantidad')
    const refaccionActualizada = await db.refacciones_l3.update({
      where: { codigo: parsedCodigo },
      data: {
        descripcion,
        noParte,
        fechaIngreso: parsedFecha,
        proveedores,
        unidadMedidaId, // enum Unidad_medida
        existenciaFisica: parsedCantidad,
        existenciaSistema: parsedExistenciaSistema,
        diferencias: diferencia,
        movimiento: "EDITADO",
        ubicacion: { connect: { id: parsedUbicacionId } },
        usuarioReportado: { connect: { id: parsedReportadoPorId } },
      },
      include: {
        usuarioReportado: { select: { id: true, nombre: true } },
      },
    })

    // Registrar historial con la NUEVA estructura
    await db.historial_movimientos.create({
      data: {
        codigo: refaccionActualizada.codigo,                    // <- usa 'codigo'
        descripcion: refaccionActualizada.descripcion,
        noParte: refaccionActualizada.noParte,
        movimiento: "EDITADO",
        cantidad: refaccionActualizada.existenciaFisica,        // lo editado
        existenciaFisicaDespues: refaccionActualizada.existenciaFisica,
        reportadoPorId: parsedReportadoPorId,                  // usa FK directa (evita connect)
        fechaMovimiento: new Date(),
        almacenEnum: "REFACCIONES",
        almacenText: "Almacén de Refacciones",
      },
    })

    return NextResponse.json(refaccionActualizada)
  } catch (error) {
    console.error("❌ Error al actualizar refacción:", error)
    return new NextResponse("INTERNAL ERROR", { status: 500 })
  }
}
