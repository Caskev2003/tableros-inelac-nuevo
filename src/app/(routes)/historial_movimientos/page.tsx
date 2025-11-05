"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft } from "lucide-react"

// Importa tus componentes como siempre:
import { Navbar } from "./components/Navbar"
import { HistorialMovimientosClient } from "./components/HistorialMovimientosClient"

/* ------------------------- Botón Regresar (inline) ------------------------ */
function ButtonRegresar({ href }: { href?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => (href ? router.push(href) : router.back())}
      aria-label="Regresar"
      className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-2 text-white backdrop-blur transition
                 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
    >
      <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
      <span className="hidden sm:inline">Regresar</span>
    </button>
  )
}

/* --------------------------------- Página -------------------------------- */
export default function Page() {
  const router = useRouter()
  const { status } = useSession() // requiere tu <SessionProvider> en layout

  // Redirección si no hay sesión
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, router])

  // Mientras verifica la sesión
  if (status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-[#2b2b2b] text-white">
        Verificando sesión…
      </div>
    )
  }

  return (
    <div className="relative bg-[#2b2b2b] min-h-screen overflow-hidden">
      {/* Navbar */}
      <Navbar />

      <div className="mt-16 px-4">
        {/* Encabezado con botón arriba a la izquierda y título centrado */}
        <div className="relative flex items-center justify-center">
          <div className="absolute left-0">
            {/* Si quieres forzar una ruta en lugar de back(), pásala en href */}
            <ButtonRegresar />
          </div>
          <h1 className="text-white text-3xl font-bold text-center">
            HISTORIAL DE MOVIMIENTOS
          </h1>
        </div>

        {/* Contenido */}
        <HistorialMovimientosClient />
      </div>
    </div>
  )
}
