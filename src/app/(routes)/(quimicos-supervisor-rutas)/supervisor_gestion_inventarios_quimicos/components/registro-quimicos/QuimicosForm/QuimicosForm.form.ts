import { z } from "zod"

export const quimicoSchema = z.object({
  codigo: z.number().min(1, "El código es requerido"),
  descripcion: z.string().min(3, "La descripción debe tener al menos 3 caracteres"),
  noLote: z.string().min(1, "El número de lote es requerido"),
  proveedores: z.string().min(1, "El proveedor es requerido"),
  fechaIngreso: z.string().min(1, "La fecha de ingreso es requerida"),
  fechaVencimiento: z.string().min(1, "La fecha de vencimiento es requerida"),
  unidadMedidaId: z.enum(["KG", "LTS", "PZ", "MTS"]),
  ubicacionId: z.number().min(1, "Debes seleccionar una ubicación"),
  existenciaSistema: z.number().min(0, "La existencia no puede ser negativa"),
  cantidad: z.number().min(1, "La cantidad debe ser al menos 1"),
  retenidos: z.number().min(0, "Los retenidos no pueden ser negativos"),
  productoLiberado: z.enum(["SI", "NO"]),
  reportadoPorId: z.number().min(1, "Usuario no identificado")
})

export type QuimicoFormValues = z.infer<typeof quimicoSchema>