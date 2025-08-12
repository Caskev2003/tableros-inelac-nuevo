import { Navbar } from "@/components/shared/Navbar"
import { auth } from "../../../../../auth"
import { redirect } from "next/navigation"
import ControlRefaccionesClient from "./components/ControlRefaccionesClient/ControlRefaccionesClient"

export default async function page() {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/login")
  }

  return (
    <div className="relative bg-[#2b2b2b] min-h-screen">
      <Navbar />

      {/* Contenido pegado al NavBar sin margen superior */}
      <div className="px-4"> {/* Eliminado mt-16 */}
        <h1 className="text-white text-3xl font-bold text-center py-1">CONTROL DE REFACCIONES</h1> {/* Añadido py-1 para mínimo espacio */}

        <ControlRefaccionesClient/>
      </div>
    </div>
  )
}