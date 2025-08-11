import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const codigo = searchParams.get("codigo");
  const noLote = searchParams.get("noLote");
  const modo = searchParams.get("modo"); // 'buscar' | 'seleccionar'

  try {
    // Validación básica
    if (!codigo && !noLote) {
      return NextResponse.json(
        { error: "Se requiere código o número de lote" },
        { status: 400 }
      );
    }

    // Modo 1: Solo código - Devuelve lista de opciones
    if (codigo && !noLote && modo !== "seleccionar") {
      const quimicos = await db.quimicos.findMany({
        where: { codigo: Number(codigo) },
        select: {
          codigo: true,
          noLote: true,
          descripcion: true,
          existenciaFisica: true,
          fechaIngreso: true,
          ubicacion: {
            select: {
              rack: true,
              posicion: true,
              fila: true
            }
          }
        },
        orderBy: { fechaIngreso: 'desc' }
      });

      if (quimicos.length === 0) {
        return NextResponse.json(
          { error: "No se encontraron químicos con ese código" },
          { status: 404 }
        );
      }

      // Si solo hay uno, devolverlo directamente
      if (quimicos.length === 1) {
        return NextResponse.json({
          resultado: quimicos[0],
          mensaje: "Se encontró un único químico con este código"
        });
      }

      // Si hay varios, devolver la lista para selección
      return NextResponse.json({
        opciones: quimicos.map(q => ({
          codigo: q.codigo,
          noLote: q.noLote,
          descripcion: q.descripcion,
          existencia: q.existenciaFisica,
          ubicacion: q.ubicacion ? 
            `Rack ${q.ubicacion.rack}, Pos ${q.ubicacion.posicion}, Fila ${q.ubicacion.fila}` : 
            'Sin ubicación',
          fechaIngreso: q.fechaIngreso.toISOString().split('T')[0]
        })),
        mensaje: `Se encontraron ${quimicos.length} químicos con este código. Seleccione uno.`
      });
    }

    // Modo 2: Código + Lote - Devuelve el químico específico
    if (codigo && noLote) {
      const quimico = await db.quimicos.findUnique({
        where: {
          quimicos_codigo_noLote_unique: {
            codigo: Number(codigo),
            noLote: noLote
          }
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

      if (!quimico) {
        return NextResponse.json(
          { error: "Químico no encontrado con ese código y número de lote" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        resultado: {
          ...quimico,
          ubicacionTexto: quimico.ubicacion ?
            `Rack ${quimico.ubicacion.rack}, Pos ${quimico.ubicacion.posicion}, Fila ${quimico.ubicacion.fila}` :
            'Sin ubicación',
          reportadoPor: quimico.usuarioReportado?.nombre || 'Desconocido'
        }
      });
    }

    // Modo 3: Solo número de lote
    if (noLote && !codigo) {
      const quimico = await db.quimicos.findFirst({
        where: { noLote },
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

      if (!quimico) {
        return NextResponse.json(
          { error: "No se encontró químico con ese número de lote" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        resultado: {
          ...quimico,
          ubicacionTexto: quimico.ubicacion ?
            `Rack ${quimico.ubicacion.rack}, Pos ${quimico.ubicacion.posicion}, Fila ${quimico.ubicacion.fila}` :
            'Sin ubicación',
          reportadoPor: quimico.usuarioReportado?.nombre || 'Desconocido'
        }
      });
    }

    return NextResponse.json(
      { error: "Parámetros de búsqueda no válidos" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Error al buscar químico:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}