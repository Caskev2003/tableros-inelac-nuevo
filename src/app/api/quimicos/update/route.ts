import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { Movimiento } from "@prisma/client"

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    
    // Validación básica
    const codigo = Number(body.codigo)
    if (isNaN(codigo)) {
      return NextResponse.json(
        { 
          success: false,
          error: "Código de químico inválido" 
        },
        { status: 400 }
      )
    }

    // Obtener químico actual para comparación
    const quimicoActual = await db.quimicos.findUnique({
      where: { codigo },
      include: { ubicacion: true }
    })

    if (!quimicoActual) {
      return NextResponse.json(
        { 
          success: false,
          error: "Químico no encontrado" 
        },
        { status: 404 }
      )
    }

    // Validar fechas
    const fechaIngreso = new Date(body.fechaIngreso)
    const fechaVencimiento = new Date(body.fechaVencimiento)
    
    if (isNaN(fechaIngreso.getTime())) {
      return NextResponse.json(
        { 
          success: false,
          error: "Fecha de ingreso inválida" 
        },
        { status: 400 }
      )
    }

    if (isNaN(fechaVencimiento.getTime())) {
      return NextResponse.json(
        { 
          success: false,
          error: "Fecha de vencimiento inválida" 
        },
        { status: 400 }
      )
    }

    if (fechaVencimiento <= fechaIngreso) {
      return NextResponse.json(
        { 
          success: false,
          error: "La fecha de vencimiento debe ser posterior a la de ingreso" 
        },
        { status: 400 }
      )
    }

    // Calcular días de vida
    const diffTime = Math.abs(fechaVencimiento.getTime() - fechaIngreso.getTime())
    const diasDeVida = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // Calcular diferencias de inventario
    const existenciaFisica = Number(body.existenciaFisica)
    const existenciaSistema = Number(body.existenciaSistema)
    const diferencias = Math.abs(existenciaFisica - existenciaSistema)

    // Actualizar el químico
    const quimicoActualizado = await db.quimicos.update({
      where: { codigo },
      data: {
        descripcion: body.descripcion,
        noLote: body.noLote,
        proveedores: body.proveedores,
        fechaIngreso,
        fechaVencimiento,
        diasDeVida,
        existenciaFisica,
        existenciaSistema,
        diferencias,
        retenidos: Number(body.retenidos) || 0,
        productoLiberado: body.productoLiberado || "NO",
        unidadMedidaId: body.unidadMedidaId,
        ubicacion: { connect: { id: Number(body.ubicacionId) } },
        movimiento: "EDITADO" as Movimiento
      },
      include: {
        ubicacion: true,
        usuarioReportado: true
      }
    })

    // Registrar en el historial
    await db.historial_movimientos.create({
      data: {
        codigoRefaccion: quimicoActualizado.codigo,
        descripcion: `Edición: ${quimicoActualizado.descripcion}`,
        noParte: quimicoActualizado.noLote,
        movimiento: "EDITADO",
        cantidad: quimicoActualizado.existenciaFisica,
        existenciaFisicaDespues: quimicoActualizado.existenciaFisica,
        reportadoPorId: quimicoActualizado.reportadoPorId
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...quimicoActualizado,
        fechaIngreso: quimicoActualizado.fechaIngreso.toISOString(),
        fechaVencimiento: quimicoActualizado.fechaVencimiento.toISOString()
      }
    })

  } catch (error) {
    console.error("Error en PUT /api/quimicos/update:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Error interno del servidor al actualizar el químico" 
      },
      { status: 500 }
    )
  }
}