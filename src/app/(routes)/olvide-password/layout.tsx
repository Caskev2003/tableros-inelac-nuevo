export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-full w-full relative bg-cover bg-center">
      <div className="h-full min-h-screen absolute w-full -z-10">
        <div className="bg-[url('/inelac_fondo_login.jpg')] h-full opacity-60 bg-no-repeat bg-cover bg-center"/>
      </div>
      <div className="flex items-center justify-center min-h-screen w-full px-4 py-5">
        <div className="px-6 md:px-8 py-6 md:py-8 rounded-2xl shadow-lg max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
