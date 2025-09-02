import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { Navbar } from "./(routes)/(home)/components/Navbar";
import { GestionAlmacen } from "./(routes)/(home)/components/GestionAlmacen";
import { ControlUsuarios } from "./(routes)/(home)/components/ControlUsuarios";

export default async function Home() {
  const session = await auth();

  // Si no hay sesión, redirige al login
  if (!session || !session.user) {
    redirect("/login");
  }

  const rol = session.user.rol;

  // Redirige según el rol del usuario
  if (rol === "SUPERVISOR_REFACCIONES") redirect("/supervisor_refacciones");
  if (rol === "SUPERVISOR_QUIMICOS") redirect("/supervisor_quimicos");
  if (rol === "DESPACHADOR") redirect("/despachador");
  if (rol !== "ADMINISTRADOR") redirect("/login"); // cualquier otro rol o ausencia


  return (
    <div className="relative bg-[#2b2b2b] min-h-screen overflow-hidden">
      <Navbar />
      <div className="mt-16 md:mt-24 lg:mt-32 mb-8 px-4">
        <h1 className="text-white text-xl md:text-3xl lg:text-4xl font-bold text-center">
          ADMINISTRADOR
        </h1>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 lg:gap-16 w-full px-4">
        <div className="flex items-center justify-center w-full md:w-1/3 lg:w-1/4">
          <GestionAlmacen />
        </div>
        <div className="flex items-center justify-center w-full md:w-1/3 lg:w-1/4">
          <ControlUsuarios />
        </div>
      </div>
    </div>
  );
}
