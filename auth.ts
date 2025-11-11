// /auth.ts  (RAÍZ DEL PROYECTO)
import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { User as NextAuthUser } from "next-auth";

interface ExtendedUser extends NextAuthUser {
  id: string;
  rol: string;
}

const config: NextAuthConfig = {
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        correo: { label: "Correo", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        const correo = credentials?.correo as string;
        const password = credentials?.password as string;
        if (!correo || !password) return null;

        // 👇 Bootstrap opcional de admin (quítalo cuando ya tengas usuarios)
        if (correo === "admin@correo.com" && password === "123456") {
          let user = await db.usuario.findUnique({ where: { correo } });
          if (!user) {
            const hashed = await bcrypt.hash(password, 10);
            user = await db.usuario.create({
              data: {
                correo,
                password: hashed,
                nombre: "Administrador",
                rol: "ADMINISTRADOR",      // usa un valor válido de tu ENUM
                imagen: "/images/default-admin.png",
              },
            });
          }
          return {
            id: String(user.id),
            name: user.nombre ?? "Administrador",
            email: user.correo,
            rol: user.rol,
            image: user.imagen ?? "/images/default-admin.png",
          };
        }

        // 👇 Login normal
        const user = await db.usuario.findUnique({ where: { correo } });
        if (!user?.password) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        return {
          id: String(user.id),
          name: user.nombre ?? "",
          email: user.correo,
          rol: user.rol,
          image: user.imagen ?? "",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).id = (user as any).id;
        (token as any).rol = (user as any).rol;
        (token as any).imagen = (user as any).image ?? "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).id as string;
        (session.user as any).rol = (token as any).rol as string;
        session.user.image = (token as any).imagen as string;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
// Para la ruta del App Router:
export const { GET, POST } = handlers;
