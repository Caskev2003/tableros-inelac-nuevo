import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import { Navbar } from "./components/Navbar";
import { ButtonRegresar } from "./components/ButtonRegresar";
import { HistorialMovimientosClient } from "./components/HistorialMovimientosClient";

export default async function page() {
  const session = await auth();

  // Si no hay sesión, redirige al login
  if (!session || !session.user) {
    redirect("/login");
  }
  
  return (
    <div className="relative bg-[#2b2b2b] min-h-screen overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Título con margen adaptativo */}
      <div className="mt-5 px-4">
        <h1 className="text-white text-3xl font-bold text-center">HISTORIAL DE MOVIMIENTOS</h1>
          <HistorialMovimientosClient/>
      </div>
      {/* Botón de regresar */}
      <div className="flex justify-center mt-10">
        <ButtonRegresar/>
      </div>
    </div>
  );
}
