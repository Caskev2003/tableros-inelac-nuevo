"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";

export function GestionAlmacenSQ() {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Contenedor principal con imagen y bordes múltiples */}
      <div
      className="relative w-40 h-40 md:w-52 md:h-52 lg:w-60 lg:h-60 rounded-full flex items-center justify-center cursor-pointer hover:shadow-lg transition duration-300 
      shadow-[0_0_0_4px_#007bff,0_0_0_8px_black,0_0_0_12px_white]"

        onClick={() => setShowMenu(!showMenu)}
      >
        {/* Imagen de almacén */}
        <img src="./iconos/quimicos_icono.png" alt="Gestión de Almacenes" className="w-full h-full rounded-full" />
      </div>

      {/* Texto debajo del círculo - más abajo y más grande */}
      <p className="text-white text-center mt-4 text-lg md:text-xl lg:text-2xl font-semibold">
        Almacén de químicos
      </p>

      {/* Menú circular alrededor del botón principal */}
      {showMenu && (
        <div className="absolute flex flex-col gap-3 right-[-115px] md:right-[-130px] lg:right-[-150px] top-9">
          {/* Botón 1: Gestion de inventario */}
          <button
            className="bg-[#0D0A62] text-white text-xs md:text-sm px-3 py-2 rounded-full shadow-lg transition-all 
            duration-300 cursor-pointer hover:bg-blue-500 border-white border-2"
            onClick={() => handleNavigation("/supervisor_gestion_inventarios_quimicos")}
          >
            📦 Gestión de inventario
          </button>
             {/* Botón 2: Historial de Movimientos */}
           <button
            className="bg-[#0D0A62] text-white text-xs md:text-sm px-3 py-2 rounded-full shadow-lg 
            transition-all duration-300 cursor-pointer hover:bg-blue-500 border-white border-2"
            onClick={() => handleNavigation("/supervisor_historial_movimientos_quimicos")}
          >
           📝Historial de movimientos
          </button>
          {/* Botón 3: Dashboard */}
          <button
            className="bg-[#0D0A62] text-white text-xs md:text-sm px-3 py-2 rounded-full shadow-lg 
            transition-all duration-300 cursor-pointer hover:bg-blue-500 border-white border-2"
            onClick={() => handleNavigation("/supervisor_dashboard_quimicos")}
          >
            📊 Dashboard
          </button>
        </div>
      )}
    </div>
  );
}