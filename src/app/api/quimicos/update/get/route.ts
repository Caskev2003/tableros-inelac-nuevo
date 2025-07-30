import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const codigo = Number(searchParams.get("codigo"))

  // Validación básica
  if (isNaN(codigo)) {
    return NextResponse.json(
      { 
        success: false,
        error: "El código debe ser un número válido" 
      },
      { status: 400 }
    )
  }

  try {
    // Obtener el químico con relaciones
    const quimico = await db.quimicos.findUnique({
      where: { codigo },
      include: {
        ubicacion: true,
        usuarioReportado: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    })

    if (!quimico) {
      return NextResponse.json(
        { 
          success: false,
          error: `Químico con código ${codigo} no encontrado` 
        },
        { status: 404 }
      )
    }

    // Calcular días de vida si no existe
    let diasDeVida = quimico.diasDeVida
    if (!diasDeVida && quimico.fechaIngreso && quimico.fechaVencimiento) {
      const diffTime = Math.abs(
        quimico.fechaVencimiento.getTime() - quimico.fechaIngreso.getTime()
      )
      diasDeVida = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    // Estructura de respuesta
    const responseData = {
      ...quimico,
      diasDeVida,
      fechaIngreso: quimico.fechaIngreso.toISOString(),
      fechaVencimiento: quimico.fechaVencimiento.toISOString(),
      // Aplanar relación ubicación
      ubicacionId: quimico.ubicacion?.id || null,
      ubicacion: quimico.ubicacion 
        ? {
            id: quimico.ubicacion.id,
            rack: quimico.ubicacion.rack,
            posicion: quimico.ubicacion.posicion,
            fila: quimico.ubicacion.fila
          }
        : null,
      // Info básica del usuario
      reportadoPor: quimico.usuarioReportado
        ? {
            id: quimico.usuarioReportado.id,
            nombre: quimico.usuarioReportado.nombre
          }
        : null
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error) {
    console.error("Error en GET /api/quimicos/update/get:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Error interno del servidor al obtener el químico" 
      },
      { status: 500 }
    )
  }
}