import { Navbar } from "@/components/shared/Navbar"
import { auth } from "../../../../../auth"
import { redirect } from "next/navigation"
import ControlQuimicosClient from "./components/ControlQuimicosClient/ControlQuimicosClient"

export default async function page() {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/login")
  }

  return (
    <div className="relative bg-[#2b2b2b] min-h-screen">
      <Navbar />

      {/* Contenido pegado al NavBar sin margen superior */}
      <div className="px-4"> {/* Eliminado completamente mt-16 */}
        <h1 className="text-white text-3xl font-bold text-center pt-1">CONTROL DE QUÍMICOS</h1> {/* pt-1 mínimo */}

        <ControlQuimicosClient/>
      </div>
    </div>
  )
}