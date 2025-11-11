import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AuthSessionProvider from '@/components/providers/session-provider';
import { auth } from "../../auth";                // 👈 auth.ts está en la RAÍZ
import { headers } from 'next/headers';
import { NavGate } from '@/components/shared/NavGate';

export const dynamic = 'force-dynamic';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Inelac - Tableros de control',
  description: 'Panel de control para inventario',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  headers();
  const session = await auth();

  const sessionUserKey =
    session?.user && 'id' in session.user ? (session.user as any).id : 'anon';

  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#2b2b2b]`}>
        <AuthSessionProvider session={session} key={sessionUserKey}>
          <NavGate />
          <main className="pt-16">{children}</main>
          <Toaster />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
