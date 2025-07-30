import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { NavbarDesktop } from "@/components/shared/Navbar/NavbarDesktop";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Inelac - Tableros de control",
  description: "Panel de control para inventario",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#2b2b2b]`}
      >
        <AuthSessionProvider>
          {/* El navbar se posiciona fijo, por eso dejamos padding top abajo */}
          <NavbarDesktop />
          <main className="pt-16">{children}</main>
          <Toaster />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
