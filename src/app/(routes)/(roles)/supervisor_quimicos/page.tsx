
import { Navbar } from "@/components/shared/Navbar";
import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import { GestionAlmacenSQ } from "../components/GestionAlmacenSQ";

export default async function Page() {

  const session = await auth();
  
    // Si no hay sesión, redirige al login
    if (!session || !session.user) {
      redirect("/login");
    }

  return (
    <div className="relative bg-[#2b2b2b] min-h-screen overflow-hidden">
      <Navbar />

      {/* Contenedor para centrar el título y los componentes en pantallas grandes */}
      <div className="mt-10 md:mt-28 lg:mt-12 mb-10 px-4">
        <h1 className="text-white text-xl md:text-3xl lg:text-4xl font-bold text-center">
          GESTIÓN DE ALMACENES
        </h1>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-20 lg:gap-36 w-full px-4">
        <GestionAlmacenSQ/>
      </div>
    </div>
  );
}
