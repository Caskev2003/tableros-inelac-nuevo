// src/app/(routes)/(auth)/forgot/layout.tsx  <-- ajusta la ruta real
import Image from 'next/image';

export default function ResettLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-screen">
      {/* Fondo */}
      <Image
        src="/iconos/inelac_fondo_login.jpg" // desde /public
        alt=""
        fill
        priority
        style={{ objectFit: 'cover' }}
        sizes="100vw"
      />
      {/* Velo oscuro (no afecta al contenido) */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Contenido centrado */}
      <div className="relative flex items-center justify-center min-h-screen w-full px-4 py-5">
        <div className="rounded-2xl shadow-lg px-6 md:px-8 py-6 md:py-8 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
