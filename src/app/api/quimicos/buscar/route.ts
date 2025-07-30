import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query")

  if (!query || isNaN(Number(query))) {
    return NextResponse.json([])
  }

  const codigoInt = parseInt(query)

  try {
    const resultados = await db.quimicos.findMany({
      where: {
        codigo: {
          gte: codigoInt,
        },
      },
      orderBy: { fechaIngreso: "desc" },
      include: {
        ubicacion: true,
        usuarioReportado: true,
      },
    })

    const filtrados = resultados.filter((item) =>
      item.codigo.toString().startsWith(query)
    )

    return NextResponse.json(filtrados)
  } catch (error) {
    console.error("Error al buscar químico por código:", error)
    return new NextResponse("INTERNAL ERROR", { status: 500 })
  }
}