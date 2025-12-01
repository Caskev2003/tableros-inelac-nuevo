"use client";
import AvisoPrivacidad from "./components/AvisoPrivacidad/AvisoPrivacidad";
import ContratoInformatico from "./components/ContratoInformatico/ContratoInformatico";
import ManualInstalacion from "./components/ManualInstalacion/ManualInstalacion";
import ManualUsuario from "./components/ManualUsuario/ManualUsuario";
import { Navbar } from "./components/Navbar";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

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

export default function pag() {
  return (
    <div className="relative bg-[#2b2b2b] min-h-screen text-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10 mt-20">
        {/* Si quieres forzar una ruta en lugar de back(), pásala en href */}
            <ButtonRegresar />
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
          ACUERDO DE PRIVACIDAD
        </h1>

        <p className="text-right text-sm text-gray-300">
          Última actualización: 08 de mayo de 2025
        </p>

        {/* SECCIONES DEL ACUERDO */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">1. Identidad del responsable</h2>
          <p className="text-justify">
            El responsable del tratamiento de tus datos personales es Industrial Envasadora de Lácteos y Derivados S.A.P.I. de C.V. – (INELAC), con domicilio en con domicilio en Km 1+114 lado
            izquierdo, tramo: Ramal a Base Naval, de la Carretera: Puerto Madero –Cd. Hidalgo,
            Estado de Chiapas, México.. Puedes contactarnos a través del correo electrónico ramora@alimentosideal.com o o llamando al número +52 962 689 0091.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">2. Datos Personales Recopilados</h2>
          <p className="text-justify">Para brindarte el mejor servicio, recopilamos los siguientes datos personales:</p>
          <ul className="list-disc pl-6">
            <li>Al crear una cuenta nueva: Nombre completo, teléfono, correo electrónico, rol o puesto, y contraseña.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">3. Finalidades del Tratamiento de Datos</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Crear y gestionar tu cuenta de usuario.</li>
            <li>Mostrar un saludo personalizado en la interfaz de la aplicación.</li>
            <li>Enviar notificaciones sobre productos próximos a vencer o ya vencidos.</li>
            <li>Generar etiquetas con información correspondiente.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">4. Transferencia de Datos</h2>
          <ul className="list-disc pl-6">
            <li>Para cumplir con obligaciones legales.</li>
            <li>En colaboración con proveedores tecnológicos necesarios.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">5. Derechos ARCO</h2>
          <ul className="list-disc pl-6">
            <li>Acceder a los datos recopilados.</li>
            <li>Rectificar datos incorrectos o desactualizados.</li>
            <li>Cancelar tus datos personales.</li>
            <li>Oponerte al uso de tus datos para ciertas finalidades.</li>
          </ul>
          <p className="text-justify">
            Contáctanos en:{" "}
            <a
              href="https://inelacmx.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              https://inelacmx.com/
            </a>
            {" "}o al correo ramora@alimentosideal.com.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">6. Medidas de Seguridad</h2>
          <p className="text-justify">Aplicamos medidas técnicas y administrativas para proteger tus datos personales de accesos no autorizados, pérdida, alteración o uso indebido.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">7. Uso de Cookies</h2>
          <p className="text-justify">Usamos cookies para mejorar la experiencia de usuario. Estas cookies no recopilan datos personales, y puedes desactivarlas en tu navegador.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">8. Modificaciones al Acuerdo</h2>
          <p className="text-justify">Nos reservamos el derecho de actualizar este aviso. Cualquier cambio será notificado mediante correos como: [correo 1], [correo 2].</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">9. Contacto</h2>
          <p className="text-justify">Si tienes dudas o quieres ejercer tus derechos, escríbenos a:</p>
          <p className="text-justify">Correo: ramora@alimentosideal.com</p>
          <p className="text-justify">Teléfono: +52 962 689 0091</p>
          <p className="text-justify">
            Página Web:{" "}
            <a
              href="https://inelacmx.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              https://inelacmx.com/
            </a>
          </p>

        </section>

        {/* COMPONENTES DE DESCARGA */}
        <div className="grid md:grid-cols-2 gap-6 pt-10">
          <AvisoPrivacidad />
          <ContratoInformatico />
          <ManualInstalacion />
          <ManualUsuario />
        </div>
      </div>
    </div>
  );
}
