import { NextResponse, NextRequest } from "next/server";
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
  existenciaSistema: number;
  cantidad: number;
  retenidos: number;
  reportadoPorId: number;
  productoLiberado: string;
}

// Función para calcular días restantes
const calcularDiasDeVida = (fechaVencimiento: Date | string): number => {
  const fechaVenc = new Date(fechaVencimiento);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // Normalizamos a inicio del día
  const diffMs = fechaVenc.getTime() - hoy.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

// Función para determinar estado y texto
const determinarEstadoCaducidad = (diasDeVida: number) => {
  if (diasDeVida <= 0) {
    return {
      estado: 'CADUCADO',
      texto: '(CADUCADO)',
      color: 'red'
    };
  } else if (diasDeVida <= 60) {
    return {
      estado: 'POR_CADUCAR',
      texto: `(POR CADUCAR - ${diasDeVida} días)`,
      color: 'yellow'
    };
  }
  return {
    estado: 'VIGENTE',
    texto: `(VIGENTE - ${diasDeVida} días)`,
    color: 'green'
  };
};

// Formateador de respuesta
const formatQuimicoResponse = (quimico: any) => {
  const diasDeVida = quimico.diasDeVida ?? calcularDiasDeVida(quimico.fechaVencimiento);
  const { estado, texto, color } = determinarEstadoCaducidad(diasDeVida);

  return {
    ...quimico,
    diasDeVida,
    estadoCaducidad: estado,
    textoEstado: texto,
    colorCaducidad: color,
    unidad: quimico.unidadMedidaId,
    reportadoPor: quimico.usuarioReportado?.nombre,
    rolReportado: quimico.usuarioReportado?.rol,
    ubicacionTexto: quimico.ubicacion 
      ? `Rack ${quimico.ubicacion.rack}, Pos. ${quimico.ubicacion.posicion}`
      : "Sin ubicación"
  };
};

// Validación de payload
const validateQuimicoPayload = (body: any): string[] => {
  const errors: string[] = [];
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
    productoLiberado: "string",
  };

  for (const [field, type] of Object.entries(requiredFields)) {
    if (!(field in body)) {
      errors.push(`Campo ${field} es requerido`);
    } else if (typeof body[field] !== type) {
      errors.push(`Campo ${field} debe ser ${type}`);
    }
  }

  return errors;
};

// POST - Crear nuevo químico
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationErrors = validateQuimicoPayload(body);
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Error de validación", details: validationErrors },
        { status: 400 }
      );
    }

    const fechaIngreso = new Date(body.fechaIngreso);
    const fechaVencimiento = new Date(body.fechaVencimiento);
    const diasDeVida = calcularDiasDeVida(fechaVencimiento);

    // Verificar duplicados
    const existeMismoLote = await db.quimicos.findFirst({
      where: {
        codigo: Number(body.codigo),
        noLote: body.noLote,
      },
    });

    if (existeMismoLote) {
      return NextResponse.json(
        {
          error: "Registro duplicado",
          message: "Ya existe un registro con este código y número de lote",
          existingId: existeMismoLote.id,
        },
        { status: 409 }
      );
    }

    // Crear registro
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
        diasDeVida,
        retenidos: Number(body.retenidos) || 0,
        productoLiberado: body.productoLiberado === "SI" ? "SI" : "NO",
        movimiento: Movimiento.NUEVO_INGRESO,
        unidadMedidaId: body.unidadMedidaId as Unidad_medida,
        ubicacion: { connect: { id: Number(body.ubicacionId) } },
        usuarioReportado: { connect: { id: Number(body.reportadoPorId) } },
      },
      include: {
        ubicacion: true,
        usuarioReportado: {
          select: {
            nombre: true,
            rol: true,
          },
        },
      },
    });

    // Registrar en historial
    await db.historial_movimientos.create({
      data: {
        codigoRefaccion: nuevoQuimico.codigo,
        descripcion: nuevoQuimico.descripcion,
        noParte: nuevoQuimico.noLote,
        movimiento: Movimiento.NUEVO_INGRESO,
        cantidad: nuevoQuimico.cantidad||0,
        existenciaFisicaDespues: nuevoQuimico.existenciaFisica,
        reportadoPorId: nuevoQuimico.reportadoPorId,
        fechaMovimiento: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: formatQuimicoResponse(nuevoQuimico),
        message: "Químico registrado correctamente",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error.message || "Error desconocido",
      },
      { status: 500 }
    );
  }
}

// GET - Obtener químicos
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const codigo = searchParams.get("codigo");
    const noLote = searchParams.get("noLote");

    // Búsqueda específica por código y lote
    if (codigo && noLote) {
      const quimico = await db.quimicos.findFirst({
        where: {
          codigo: Number(codigo),
          noLote,
        },
        include: {
          ubicacion: true,
          usuarioReportado: {
            select: {
              nombre: true,
              rol: true,
            },
          },
        },
      });

      if (!quimico) {
        return NextResponse.json(
          { error: "No encontrado", message: "No existe un químico con ese código y lote" },
          { status: 404 }
        );
      }

      return NextResponse.json(formatQuimicoResponse(quimico));
    }

    // Listado general
    const limit = Number(searchParams.get("limit")) || undefined;
    const offset = Number(searchParams.get("offset")) || 0;

    const quimicos = await db.quimicos.findMany({
      include: {
        ubicacion: true,
        usuarioReportado: {
          select: {
            nombre: true,
            rol: true,
          },
        },
      },
      orderBy: { codigo: "asc" },
      take: limit,
      skip: offset,
    });

    return NextResponse.json(quimicos.map(formatQuimicoResponse));
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener químicos",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar químico
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let codigo = searchParams.get("codigo");
    let noLote = searchParams.get("noLote");

    // Opción para recibir parámetros por body
    if ((!codigo || !noLote) && request.method === "DELETE") {
      try {
        const body = await request.json();
        codigo = body.codigo;
        noLote = body.noLote;
      } catch (e) {
        console.log("No se pudo parsear el body");
      }
    }

    // Validación
    if (!codigo || !noLote) {
      return NextResponse.json(
        {
          success: false,
          error: "Parámetros inválidos",
          message: "Se requieren código y número de lote",
        },
        { status: 400 }
      );
    }

    // Buscar químico
    const quimicoExistente = await db.quimicos.findFirst({
      where: {
        codigo: Number(codigo),
        noLote,
      },
      include: {
        usuarioReportado: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    if (!quimicoExistente) {
      return NextResponse.json(
        {
          success: false,
          error: "No encontrado",
          message: `No existe un químico con código ${codigo} y lote ${noLote}`,
        },
        { status: 404 }
      );
    }

    // Registrar en historial antes de eliminar
    await db.historial_movimientos.create({
      data: {
        codigoRefaccion: quimicoExistente.codigo,
        descripcion: quimicoExistente.descripcion,
        noParte: quimicoExistente.noLote,
        movimiento: Movimiento.ELIMINADO,
        cantidad: quimicoExistente.existenciaFisica,
        existenciaFisicaDespues: 0,
        reportadoPorId: quimicoExistente.reportadoPorId,
        fechaMovimiento: new Date(),
      },
    });

    // Eliminar
    await db.quimicos.delete({
      where: { id: quimicoExistente.id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Químico eliminado correctamente",
        data: {
          id: quimicoExistente.id,
          codigo: quimicoExistente.codigo,
          noLote: quimicoExistente.noLote,
          descripcion: quimicoExistente.descripcion,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error al eliminar:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno",
        message: "Ocurrió un error al procesar la solicitud",
        details: error.message,
      },
      { status: 500 }
    );
  }
}