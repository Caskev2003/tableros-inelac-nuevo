import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import type { NextAuthConfig } from "next-auth"
import type { User as NextAuthUser } from "next-auth"

// Extendemos para incluir ID y rol
interface ExtendedUser extends NextAuthUser {
  id: string
  rol: string
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        correo: { label: "Correo", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        const correo = credentials?.correo as string
        const password = credentials?.password as string

        if (!correo || !password) return null

        const user = await db.usuario.findUnique({
          where: { correo },
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return null

        return {
          id: user.id.toString(),
          name: user.nombre ?? "",
          email: user.correo,
          rol: user.rol,
          imagen: user.imagen ?? "", // Asegúrate de que la URL de la imagen sea válida
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.rol = user.rol as string
        token.imagen = user.imagen ?? ""  //  // Asegúrate de que la imagen esté siendo asignada
        console.log('JWT token:', token) // Depura el token
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.rol = token.rol as string
        session.user.image = token.imagen as string
        
      }
      return session
    },
  },
})
