import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Movimiento, Unidad_medida } from "@prisma/client";

// Tipos para TypeScript
interface QuimicoPayload {
  codigo: number;
  descripcion: string;
  noLote: string;
  proveedores: string;
  fechaIngreso: string;
  fechaVencimiento: string;
  unidadMedidaId: string;
  ubicacionId: number;
  existenciaSistema: number;
  cantidad: number;
  retenidos: number;
  reportadoPorId: number;
  productoLiberado: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Datos recibidos:", body);

    // Validaciones mejoradas
    const validationErrors = [];
    const requiredFields: Record<keyof QuimicoPayload, string> = {
      codigo: "number",
      descripcion: "string",
      noLote: "string",
      proveedores: "string",
      fechaIngreso: "string",
      fechaVencimiento: "string",
      unidadMedidaId: "string",
      ubicacionId: "number",
      existenciaSistema: "number",
      cantidad: "number",
      retenidos: "number",
      reportadoPorId: "number",
      productoLiberado: "string"
    };

    for (const [field, type] of Object.entries(requiredFields)) {
      if (!(field in body)) {
        validationErrors.push(`Campo ${field} es requerido`);
      } else if (typeof body[field] !== type) {
        validationErrors.push(`Campo ${field} debe ser ${type}`);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Error de validación", details: validationErrors },
        { status: 400 }
      );
    }

    // Validación de fechas
    const fechaIngreso = new Date(body.fechaIngreso);
    const fechaVencimiento = new Date(body.fechaVencimiento);
    
    if (isNaN(fechaIngreso.getTime()) || isNaN(fechaVencimiento.getTime())) {
      return NextResponse.json(
        { error: "Fechas inválidas" },
        { status: 400 }
      );
    }

    // Validar unidad de medida
    if (!Object.values(Unidad_medida).includes(body.unidadMedidaId as Unidad_medida)) {
      return NextResponse.json(
        { error: "Unidad de medida no válida", values: Object.values(Unidad_medida) },
        { status: 400 }
      );
    }

    // Crear el registro
    const nuevoQuimico = await db.quimicos.create({
      data: {
        codigo: Number(body.codigo),
        descripcion: body.descripcion,
        noLote: body.noLote,
        existenciaFisica: Number(body.cantidad),
        existenciaSistema: Number(body.existenciaSistema),
        diferencias: Math.abs(Number(body.cantidad) - Number(body.existenciaSistema)),
        proveedores: body.proveedores,
        cantidadEntrada: Number(body.cantidad),
        cantidadSalida: 0,
        cantidad: Number(body.cantidad),
        fechaIngreso,
        fechaVencimiento,
        diasDeVida: Math.ceil(
          (fechaVencimiento.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24)
        ),
        retenidos: Number(body.retenidos) || 0,
        productoLiberado: body.productoLiberado === "SI" ? "SI" : "NO",
        movimiento: Movimiento.NUEVO_INGRESO,
        unidadMedidaId: body.unidadMedidaId as Unidad_medida,
        ubicacion: { connect: { id: Number(body.ubicacionId) } },
        usuarioReportado: { connect: { id: Number(body.reportadoPorId) } }
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

    return NextResponse.json({
      success: true,
      data: {
        ...nuevoQuimico,
        unidad: nuevoQuimico.unidadMedidaId,
        reportadoPor: nuevoQuimico.usuarioReportado?.nombre,
        rolReportado: nuevoQuimico.usuarioReportado?.rol
      },
      message: "Químico registrado correctamente"
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Error interno del servidor",
        details: error.message || 'Error desconocido',
        ...(error.code && { code: error.code })
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || undefined;
    const offset = Number(searchParams.get('offset')) || 0;

    const quimicos = await db.quimicos.findMany({
      include: {
        ubicacion: true,
        usuarioReportado: {
          select: {
            nombre: true,
            rol: true
          }
        }
      },
      orderBy: { codigo: 'asc' },
      take: limit,
      skip: offset
    });

    // Formatear los datos para el frontend
    const quimicosFormateados = quimicos.map(quimico => ({
      ...quimico,
      unidad: quimico.unidadMedidaId,
      ubicacionTexto: quimico.ubicacion ? 
        `Rack ${quimico.ubicacion.rack}, Pos. ${quimico.ubicacion.posicion}` : 
        'Sin ubicación',
      fechaIngreso: quimico.fechaIngreso.toISOString(),
      fechaVencimiento: quimico.fechaVencimiento.toISOString(),
      reportadoPor: quimico.usuarioReportado?.nombre || 'Desconocido',
      rolReportado: quimico.usuarioReportado?.rol || 'No especificado',
      existenciaFisica: quimico.existenciaFisica || 0,
      existenciaSistema: quimico.existenciaSistema || 0,
      diferencias: quimico.diferencias || 0,
      cantidadEntrada: quimico.cantidadEntrada || 0,
      cantidadSalida: quimico.cantidadSalida || 0,
      cantidad: quimico.cantidad || 0,
      diasDeVida: quimico.diasDeVida || 0,
      retenidos: quimico.retenidos || 0,
      entrada: quimico.cantidadEntrada || 0,
      salida: quimico.cantidadSalida || 0
    }));

    return NextResponse.json(quimicosFormateados);

  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener químicos",
        details: error.message || 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codigo = Number(searchParams.get('codigo'));
    
    if (!codigo || isNaN(codigo)) {
      return NextResponse.json(
        { 
          success: false,
          error: "Código inválido",
          message: "Se requiere un código numérico válido" 
        },
        { status: 400 }
      );
    }

    // Verificar si el químico existe
    const quimicoExistente = await db.quimicos.findUnique({
      where: { codigo },
      include: {
        usuarioReportado: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    if (!quimicoExistente) {
      return NextResponse.json(
        { 
          success: false,
          error: "No encontrado",
          message: "El químico no existe o ya fue eliminado" 
        },
        { status: 404 }
      );
    }

    // Registrar en el historial antes de eliminar
    await db.historial_movimientos.create({
      data: {
        codigoRefaccion: quimicoExistente.codigo,
        descripcion: quimicoExistente.descripcion,
        noParte: quimicoExistente.noLote,
        movimiento: Movimiento.ELIMINADO,
        cantidad: quimicoExistente.existenciaFisica,
        existenciaFisicaDespues: 0,
        reportadoPorId: quimicoExistente.reportadoPorId,
        fechaMovimiento: new Date()
      }
    });

    // Eliminar el químico
    await db.quimicos.delete({
      where: { codigo }
    });

    return NextResponse.json(
      { 
        success: true,
        message: `Químico "${quimicoExistente.descripcion}" eliminado correctamente`,
        data: {
          codigo: quimicoExistente.codigo,
          descripcion: quimicoExistente.descripcion,
          noLote: quimicoExistente.noLote,
          reportadoPor: quimicoExistente.usuarioReportado?.nombre || 'Desconocido'
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error al eliminar químico:", error);
    
    // Manejar errores específicos de Prisma
    if (error.code === "P2025") {
      return NextResponse.json(
        { 
          success: false,
          error: "No encontrado",
          message: "El registro no existe o ya fue eliminado" 
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: "Error interno",
        message: "Ocurrió un error al procesar la solicitud",
        details: error.message 
      },
      { status: 500 }
    );
  }
}