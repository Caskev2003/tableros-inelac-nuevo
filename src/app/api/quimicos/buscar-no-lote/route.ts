import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query")

  if (!query) return NextResponse.json([])

  try {
    const todos = await db.quimicos.findMany({
      orderBy: { fechaIngreso: "desc" },
      include: {
        ubicacion: true,
        usuarioReportado: true,
      },
    })

    const filtrados = todos.filter((quimico) =>
      quimico.noLote.toLowerCase().includes(query.toLowerCase())
    )

    return NextResponse.json(filtrados)
  } catch (error) {
    console.error("Error al buscar por número de lote:", error)
    return new NextResponse("INTERNAL ERROR", { status: 500 })
  }
}