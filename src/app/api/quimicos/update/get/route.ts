import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const codigo = searchParams.get("codigo");
  const noLote = searchParams.get("noLote");

  // Validación de parámetros
  if (!codigo || isNaN(Number(codigo))) {
    return NextResponse.json(
      { 
        success: false,
        error: "Código inválido o no proporcionado",
        suggestion: "Proporcione un código numérico válido"
      },
      { status: 400 }
    );
  }

  if (!noLote) {
    return NextResponse.json(
      { 
        success: false,
        error: "Número de lote no proporcionado",
        suggestion: "El número de lote es requerido"
      },
      { status: 400 }
    );
  }

  try {
    // Buscar el químico usando el índice único compuesto
    const quimico = await db.quimicos.findUnique({
      where: { 
        quimicos_codigo_noLote_unique: {
          codigo: Number(codigo),
          noLote: noLote
        }
      },
      include: {
        ubicacion: {
          select: {
            id: true,
            rack: true,
            posicion: true,
            fila: true
          }
        },
        usuarioReportado: {
          select: {
            id: true,
            nombre: true,
            rol: true
          }
        }
      }
    });

    if (!quimico) {
      return NextResponse.json(
        { 
          success: false,
          error: `Químico no encontrado (Código: ${codigo}, Lote: ${noLote})`,
          suggestion: "Verifique que el código y lote sean correctos"
        },
        { status: 404 }
      );
    }

    // Calcular días de vida si no está definido
    let diasDeVida = quimico.diasDeVida;
    if (!diasDeVida && quimico.fechaIngreso && quimico.fechaVencimiento) {
      const diff = quimico.fechaVencimiento.getTime() - quimico.fechaIngreso.getTime();
      diasDeVida = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    // Formatear respuesta
    return NextResponse.json({
      success: true,
      data: {
        id: quimico.id,
        codigo: quimico.codigo,
        noLote: quimico.noLote,
        descripcion: quimico.descripcion,
        existenciaFisica: quimico.existenciaFisica,
        existenciaSistema: quimico.existenciaSistema,
        diferencias: quimico.diferencias,
        proveedores: quimico.proveedores,
        fechaIngreso: quimico.fechaIngreso?.toISOString(),
        fechaVencimiento: quimico.fechaVencimiento?.toISOString(),
        diasDeVida: diasDeVida,
        retenidos: quimico.retenidos,
        productoLiberado: quimico.productoLiberado,
        unidadMedidaId: quimico.unidadMedidaId,
        ubicacionId: quimico.ubicacionId,
        reportadoPorId: quimico.reportadoPorId,
        ubicacion: quimico.ubicacion,
        reportadoPor: quimico.usuarioReportado
      }
    });

  } catch (error: unknown) {
    console.error("Error al obtener químico:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Error interno al buscar el químico",
        details: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}