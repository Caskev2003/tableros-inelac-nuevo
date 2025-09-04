"use server"

import { signIn } from "../auth"
import { signInSchema } from "../src/lib/zod"
import { z } from "zod"
import { db } from "@/lib/db"

export const login = async (values: z.infer<typeof signInSchema>) => {
  const validatedFields = signInSchema.safeParse(values)

  if (!validatedFields.success) {
    return { error: "Campos inválidos" }
  }

  const { correo, password } = validatedFields.data

  // Buscamos el rol directamente en la DB
  const user = await db.usuario.findUnique({ where: { correo } })
  const rol = user?.rol

  try {
    await signIn("credentials", {
      correo,
      password,
      redirect: false,
    })

    switch (rol) {
      case "ADMINISTRADOR":
        return { success: true, redirectTo: "/" }
      case "SUPERVISOR_REFACCIONES":
        return { success: true, redirectTo: "/supervisor_refacciones" }
      case "SUPERVISOR_QUIMICOS":
        return { success: true, redirectTo: "/supervisor_quimicos" }
      case "DESPACHADOR":
        return { success: true, redirectTo: "/despachador" }
      default:
        return { error: "Rol desconocido" }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      // Manejo específico de errores de autenticación
      const authError = error as { type?: string }
      switch (authError.type) {
        case "CredentialsSignin":
          return { error: "Credenciales inválidas!" }
        default:
          return { error: "Error desconocido" }
      }
    }
    
    // Manejo de otros tipos de errores
    return { error: "Ocurrió un error inesperado" }
  }
}