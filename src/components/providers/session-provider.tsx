'use client';

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

export default function SessionProvider({
  children,
  session,
}: {
  children: ReactNode;
  session?: Session | null; // puede venir undefined/null
}) {
  return (
    <NextAuthSessionProvider session={session ?? null}>
      {children}
    </NextAuthSessionProvider>
  );
}
