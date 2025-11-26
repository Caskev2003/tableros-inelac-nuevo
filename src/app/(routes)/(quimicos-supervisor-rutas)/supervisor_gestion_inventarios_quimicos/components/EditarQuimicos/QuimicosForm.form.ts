import { z } from "zod"
import { Movimiento, Unidad_medida } from "@prisma/client"

export const quimicoSchema = z.object({
  // Campo ID agregado como número requerido
  id: z.coerce.number()
    .int("El ID debe ser un número entero")
    .positive("El ID debe ser positivo")
    .min(1, "ID inválido"),
    
  codigo: z.coerce.number()
    .int("El código debe ser un número entero")
    .positive("El código debe ser positivo"),
    
  descripcion: z.string()
    .min(1, "La descripción es obligatoria")
    .max(80, "La descripción no puede exceder los 80 caracteres"),
    
  noLote: z.string()
    .min(1, "El número de lote es obligatorio")
    .max(50, "El número de lote no puede exceder los 50 caracteres"),
    
  proveedores: z.string()
    .min(1, "Proveedor requerido")
    .max(80, "El proveedor no puede exceder los 80 caracteres"),
    
  fechaIngreso: z.string()
    .min(1, "Fecha de ingreso requerida")
    .refine(val => !isNaN(Date.parse(val)), "Fecha de ingreso inválida"),
    
  fechaVencimiento: z.string()
    .min(1, "Fecha de vencimiento requerida")
    .refine(val => !isNaN(Date.parse(val)), "Fecha de vencimiento inválida"),
    
  unidadMedidaId: z.nativeEnum(Unidad_medida, {
    errorMap: () => ({ message: "Unidad de medida inválida" })
  }),
    
  ubicacionId: z.coerce.number()
    .int("Debe ser un ID válido")
    .positive("Debe ser un ID válido")
    .min(1, "Ubicación requerida"),
    
  reportadoPorId: z.coerce.number()
    .int("Debe ser un ID válido")
    .positive("Debe ser un ID válido")
    .min(1, "Usuario requerido"),
    
  existenciaFisica: z.coerce.number()
    .min(0, "La existencia debe ser 0 o más")
    .max(199999, "La existencia no puede ser mayor a 199999"),
    
  existenciaSistema: z.coerce.number()
    .min(0, "La existencia no puede ser negativa")
    .max(199999, "La existencia no puede ser mayor a 199999"),
    
  movimiento: z.nativeEnum(Movimiento, {
    errorMap: () => ({ message: "Tipo de movimiento inválido" })
  }).default("EDITADO"),
    
  productoLiberado: z.enum(["SI", "NO"], {
    errorMap: () => ({ message: "Debe ser SI o NO" })
  }).default("NO"),
    
  retenidos: z.coerce.number()
    .int("Debe ser un número entero")
    .min(0, "No puede ser negativo")
    .max(199999, "No puede ser mayor a 199999")
    .default(0),
    
  diasDeVida: z.coerce.number()
    .int("Debe ser un número entero")
    .min(0, "No puede ser negativo")
    .max(3650, "No puede ser mayor a 10 años (3650 días)")
    .optional()
    .nullable(),
    
}).refine(data => {
  // Validación cruzada: fecha vencimiento > fecha ingreso
  if (!data.fechaIngreso || !data.fechaVencimiento) return true
  return new Date(data.fechaVencimiento) > new Date(data.fechaIngreso)
}, {
  message: "La fecha de vencimiento debe ser posterior a la fecha de ingreso",
  path: ["fechaVencimiento"]
})