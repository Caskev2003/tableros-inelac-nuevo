// src/auth.ts
import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";

type AppUser = {
  id: string;
  rol: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

const config: NextAuthConfig = {
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        correo: { label: "Correo", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      // 👇 acepta el tipo que espera la lib: Partial<...> | undefined
      async authorize(
        credentials: Partial<Record<"correo" | "password", unknown>> | undefined
      ): Promise<AppUser | null> {
        const correo =
          typeof credentials?.correo === "string" ? credentials.correo.trim() : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!correo || !password) return null;

        const user = await db.usuario.findUnique({ where: { correo } });
        if (!user?.password) return null;

        const ok = await bcrypt.compare(password, String(user.password));
        if (!ok) return null;

        return {
          id: String(user.id),
          rol: user.rol,
          name: user.nombre ?? "",
          email: user.correo,
          image: user.imagen ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User | AppUser }) {
      if (user) {
        (token as any).id = (user as AppUser).id;
        (token as any).rol = (user as AppUser).rol;
        (token as any).imagen = (user as AppUser).image ?? "";
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        (session.user as any).id = (token as any).id as string;
        (session.user as any).rol = (token as any).rol as string;
        session.user.image = (token as any).imagen as string;
      }
      return session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);
