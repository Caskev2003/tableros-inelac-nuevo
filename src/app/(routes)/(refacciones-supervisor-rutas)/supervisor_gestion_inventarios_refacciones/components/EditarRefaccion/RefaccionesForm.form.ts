import { z } from "zod"

export const refaccionSchema = z.object({
  codigo: z.coerce.number(),
  descripcion: z.string().min(1, "La descripción es obligatoria") .max(150, "Haz superado el limite de caracteres, el limite debe ser 80 caracteres"),
  noParte: z.string().min(1, "El número de parte es obligatorio"),
  proveedores: z.string().min(1, "Proveedor requerido"),
  fechaIngreso: z.string().min(1, "Fecha requerida"),
  unidadMedidaId: z.enum(["KG", "LTS", "PZ", "MTS"]),
  ubicacionId: z.coerce.number().min(1, "Ubicación requerida"),
  reportadoPorId: z.coerce.number().min(1, "Usuario requerido"),
  cantidad: z.coerce.number().min(1, "La cantidad debe ser mayor a 0"),
  existenciaSistema: z.coerce.number().min(0, "La existencia debe ser 0 o más")
})
