import { z } from "zod"

export const refaccionSchema = z.object({
  codigo: z.number().min(1, "El código es requerido"),
  descripcion: z.string().min(1, "La descripción es obligatoria") .max(150, "Haz superado el limite de caracteres, el limite debe ser 80 caracteres"),
  noParte: z.string().min(1, "El número de parte es obligatorio") .max(50, "Haz superado el limite de caracteres, el limite debe ser 80 caracteres"),
  proveedores: z.string().min(1, "Proveedor requerido") .max(80, "Haz superado el limite de caracteres, el limite debe ser 80 caracteres"),
  fechaIngreso: z.string().min(1, "Fecha requerida"),
  unidadMedidaId: z.enum(["KG", "LTS", "PZ", "MTS"]),
  ubicacionId: z.number().min(1, "Ubicación requerida"), // Cambiado de coerce.number() a number()
  reportadoPorId: z.number().min(1, "Usuario requerido"), // Cambiado de coerce.number() a number()
  cantidad: z.number().min(1, "La cantidad debe ser mayor a 0"),
  existenciaSistema: z.number().min(0, "La existencia debe ser 0 o más") // Cambiado de coerce.number() a number()
})

export type RefaccionesFormValues = z.infer<typeof refaccionSchema>