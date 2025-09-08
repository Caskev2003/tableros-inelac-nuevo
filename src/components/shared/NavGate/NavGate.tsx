// src/components/shared/NavGate.tsx
"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "../Navbar"

// Rutas donde NO quieres el navbar global
const EXCLUDE = ["/", "/login", "/control_usuarios","/uso_privacidad", "/gestion_inventario_refacciones"
    ,"/historial_movimientos", "/dashboard_refacciones","gestion_inventario_quimicos","dashboard_quimicos","/supervisor_refacciones"
    ,"/supervisor_gestion_inventarios_refacciones", "/supervisor_gestion_inventarios_quimicos","/supervisor_historial_movimientos"
    ,"/supervisor_dashboard_quimicos","/supervisor_dashboard_refacciones","/supervisor_historial_movimientos_quimicos","/supervisor_quimicos"
    ,"/despachador","/despachador_gestion_inventarios_refacciones","/despachador_gestion_inventarios_quimicos","/despachador_historial_movimientos_refacciones"
    ,"/despachador_historial_movimientos_quimicos","/despachador_dashboard_refacciones","/despachador_dashboard_quimicos"
]

export function NavGate() {
  const pathname = usePathname()
  const hide = EXCLUDE.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  )
  if (hide) return null
  return <Navbar />
}
