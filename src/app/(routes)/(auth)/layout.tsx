import Image from 'next/image';

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-screen">
      {/* Fondo */}
      <Image
        src="/inelac_fondo_login.jpg"  // viene de /public
        alt=""
        fill
        priority
        unoptimized
        style={{ objectFit: 'cover' }}
        sizes="100vw"
      />
      {/* Velo oscuro independiente (no afecta al contenido) */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Contenido */}
      <div className="relative flex lg:justify-start justify-center items-center h-full w-full pl-4 pr-8 py-5">
        <div className="ml-6 bg-white px-6 md:px-8 py-6 md:py-8 rounded-2xl shadow-lg max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
