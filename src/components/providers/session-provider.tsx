// src/components/providers/session-provider.tsx
"use client"
import { SessionProvider } from "next-auth/react"
import type { ReactNode } from "react"
import type { Session as AuthCoreSession } from "@auth/core/types"

export function AuthSessionProvider({
  children,
  session,
}: {
  children: ReactNode
  session?: AuthCoreSession | null
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
