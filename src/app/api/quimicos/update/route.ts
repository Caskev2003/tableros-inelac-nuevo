// src/app/api/quimicos/update/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Movimiento, Unidad_medida } from "@prisma/client";

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // Validación básica de campos requeridos
    if (!body.codigo || typeof body.codigo !== 'number' || body.codigo < 1) {
      return NextResponse.json(
        { 
          success: false,
          error: "Código inválido: debe ser un número entero positivo",
          field: "codigo"
        },
        { status: 400 }
      );
    }

    if (!body.noLote || typeof body.noLote !== 'string' || body.noLote.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: "Número de lote es requerido",
          field: "noLote"
        },
        { status: 400 }
      );
    }

    // Buscar el químico por código y lote
    const quimicoExistente = await db.quimicos.findFirst({
      where: { 
        codigo: body.codigo,
        noLote: body.noLote
      }
    });

    if (!quimicoExistente) {
      return NextResponse.json(
        { 
          success: false,
          error: `Químico con código ${body.codigo} y lote ${body.noLote} no encontrado`,
          details: "Verifique que el código y número de lote sean correctos"
        },
        { status: 404 }
      );
    }

    // Validación de fechas
    const fechaIngreso = new Date(body.fechaIngreso);
    const fechaVencimiento = new Date(body.fechaVencimiento);
    
    if (isNaN(fechaIngreso.getTime())) {
      return NextResponse.json(
        { 
          success: false,
          error: "Fecha de ingreso inválida",
          field: "fechaIngreso"
        },
        { status: 400 }
      );
    }

    if (isNaN(fechaVencimiento.getTime())) {
      return NextResponse.json(
        { 
          success: false,
          error: "Fecha de vencimiento inválida",
          field: "fechaVencimiento"
        },
        { status: 400 }
      );
    }

    if (fechaVencimiento <= fechaIngreso) {
      return NextResponse.json(
        { 
          success: false,
          error: "La fecha de vencimiento debe ser posterior a la de ingreso",
          field: "fechaVencimiento"
        },
        { status: 400 }
      );
    }

    // Validación de unidad de medida
    const unidadesValidas = Object.values(Unidad_medida);
    if (!body.unidadMedidaId || !unidadesValidas.includes(body.unidadMedidaId)) {
      return NextResponse.json(
        { 
          success: false,
          error: `Unidad de medida inválida. Valores válidos: ${unidadesValidas.join(', ')}`,
          field: "unidadMedidaId"
        },
        { status: 400 }
      );
    }

    // Validación de ubicación
    if (!body.ubicacionId || typeof body.ubicacionId !== 'number' || body.ubicacionId < 1) {
      return NextResponse.json(
        { 
          success: false,
          error: "Ubicación inválida: debe ser un ID válido",
          field: "ubicacionId"
        },
        { status: 400 }
      );
    }

    // Validación de existencias
    if (typeof body.existenciaFisica !== 'number' || body.existenciaFisica < 0 || body.existenciaFisica > 9999) {
      return NextResponse.json(
        { 
          success: false,
          error: "Existencia física inválida: debe ser entre 0 y 9999",
          field: "existenciaFisica"
        },
        { status: 400 }
      );
    }

    if (typeof body.existenciaSistema !== 'number' || body.existenciaSistema < 0 || body.existenciaSistema > 9999) {
      return NextResponse.json(
        { 
          success: false,
          error: "Existencia en sistema inválida: debe ser entre 0 y 9999",
          field: "existenciaSistema"
        },
        { status: 400 }
      );
    }

    // Validación de producto liberado
    if (!['SI', 'NO'].includes(body.productoLiberado)) {
      return NextResponse.json(
        { 
          success: false,
          error: "Producto liberado debe ser 'SI' o 'NO'",
          field: "productoLiberado"
        },
        { status: 400 }
      );
    }

    // Validación de retenidos
    if (typeof body.retenidos !== 'number' || body.retenidos < 0 || body.retenidos > 9999) {
      return NextResponse.json(
        { 
          success: false,
          error: "Retenidos inválidos: debe ser entre 0 y 9999",
          field: "retenidos"
        },
        { status: 400 }
      );
    }

    // Calcular días de vida
    const diasDeVida = body.diasDeVida || Math.ceil(
      Math.abs(fechaVencimiento.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calcular diferencias de inventario
    const diferencias = Math.abs(body.existenciaFisica - body.existenciaSistema);

    // Actualizar el químico usando código y lote como identificador
    const quimicoActualizado = await db.quimicos.update({
      where: { 
        id: quimicoExistente.id // Usamos el ID interno encontrado
      },
      data: {
        descripcion: body.descripcion,
        proveedores: body.proveedores,
        fechaIngreso: fechaIngreso,
        fechaVencimiento: fechaVencimiento,
        diasDeVida: diasDeVida,
        existenciaFisica: body.existenciaFisica,
        existenciaSistema: body.existenciaSistema,
        diferencias: diferencias,
        retenidos: body.retenidos,
        productoLiberado: body.productoLiberado,
        unidadMedidaId: body.unidadMedidaId,
        ubicacion: { connect: { id: body.ubicacionId } },
        usuarioReportado: { connect: { id: body.reportadoPorId } },
        movimiento: 'EDITADO' as Movimiento
      },
      include: {
        ubicacion: true,
        usuarioReportado: {
          select: {
            nombre: true,
            rol: true
          }
        }
      }
    });

    // Registrar en el historial de movimientos
    await db.historial_movimientos.create({
      data: {
        codigoRefaccion: quimicoActualizado.codigo,
        descripcion: `Edición: ${quimicoActualizado.descripcion}`,
        noParte: quimicoActualizado.noLote,
        movimiento: 'EDITADO' as Movimiento,
        cantidad: quimicoActualizado.existenciaFisica,
        existenciaFisicaDespues: quimicoActualizado.existenciaFisica,
        reportadoPorId: quimicoActualizado.reportadoPorId,
        fechaMovimiento: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        codigo: quimicoActualizado.codigo,
        noLote: quimicoActualizado.noLote,
        descripcion: quimicoActualizado.descripcion,
        existenciaFisica: quimicoActualizado.existenciaFisica,
        existenciaSistema: quimicoActualizado.existenciaSistema,
        diferencias: quimicoActualizado.diferencias,
        proveedores: quimicoActualizado.proveedores,
        fechaIngreso: quimicoActualizado.fechaIngreso.toISOString(),
        fechaVencimiento: quimicoActualizado.fechaVencimiento.toISOString(),
        diasDeVida: quimicoActualizado.diasDeVida,
        retenidos: quimicoActualizado.retenidos,
        productoLiberado: quimicoActualizado.productoLiberado,
        movimiento: quimicoActualizado.movimiento,
        unidadMedidaId: quimicoActualizado.unidadMedidaId,
        ubicacionId: quimicoActualizado.ubicacionId,
        reportadoPorId: quimicoActualizado.reportadoPorId,
        ubicacion: quimicoActualizado.ubicacion,
        reportadoPor: quimicoActualizado.usuarioReportado
      },
      message: "Químico actualizado correctamente"
    });

  } catch (error: unknown) {
    console.error('Error en la API PUT /api/quimicos/update:', error);
    
    // Manejo de errores de Prisma
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const prismaError = error as { code: string };
      
      if (prismaError.code === "P2025") {
        return NextResponse.json(
          { 
            success: false,
            error: "No encontrado",
            message: "El químico no existe o ya fue eliminado"
          },
          { status: 404 }
        );
      }

      if (prismaError.code === "P2002") {
        return NextResponse.json(
          { 
            success: false,
            error: "Violación de restricción única",
            message: "Ya existe un químico con este código y número de lote"
          },
          { status: 409 }
        );
      }
    }

    // Manejo genérico de errores
    let errorMessage = "Error interno del servidor";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        message: "Ocurrió un error al actualizar el químico",
        details: process.env.NODE_ENV === "development" ? 
          (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}