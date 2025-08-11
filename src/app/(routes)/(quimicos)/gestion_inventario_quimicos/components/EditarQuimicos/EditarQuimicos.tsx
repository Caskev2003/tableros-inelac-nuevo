"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { quimicoSchema } from "./QuimicosForm.form"
import { z } from "zod"
import axios from "axios"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Unidad_medida, Movimiento } from "@prisma/client"

type FormValues = z.infer<typeof quimicoSchema>

interface Props {
  quimico: {
    id: number
    codigo: number
    descripcion: string
    noLote: string
    proveedores: string
    fechaIngreso: string
    fechaVencimiento: string
    unidadMedidaId: Unidad_medida
    ubicacionId: number
    existenciaFisica: number
    existenciaSistema: number
    retenidos: number
    productoLiberado: string
    diasDeVida?: number
    reportadoPorId: number
  }
  ubicaciones: Array<{
    id: number
    rack: number
    posicion: string
    fila: string
  }>
  onSuccess?: () => void
}

export function EditarQuimico({ quimico, ubicaciones, onSuccess }: Props) {
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(quimicoSchema),
    defaultValues: {
      id: quimico.id,
      codigo: quimico.codigo,
      descripcion: quimico.descripcion,
      noLote: quimico.noLote,
      proveedores: quimico.proveedores,
      fechaIngreso: quimico.fechaIngreso,
      fechaVencimiento: quimico.fechaVencimiento,
      unidadMedidaId: quimico.unidadMedidaId,
      ubicacionId: quimico.ubicacionId,
      existenciaFisica: quimico.existenciaFisica,
      existenciaSistema: quimico.existenciaSistema,
      retenidos: quimico.retenidos,
      productoLiberado: quimico.productoLiberado === "SI" ? "SI" : "NO",
      diasDeVida: quimico.diasDeVida,
      reportadoPorId: quimico.reportadoPorId,
      movimiento: "EDITADO" as Movimiento
    }
  })

  useEffect(() => {
    if (quimico) {
      form.reset({
        id: quimico.id,
        codigo: quimico.codigo,
        descripcion: quimico.descripcion,
        noLote: quimico.noLote,
        proveedores: quimico.proveedores,
        fechaIngreso: quimico.fechaIngreso,
        fechaVencimiento: quimico.fechaVencimiento,
        unidadMedidaId: quimico.unidadMedidaId,
        ubicacionId: quimico.ubicacionId,
        existenciaFisica: quimico.existenciaFisica,
        existenciaSistema: quimico.existenciaSistema,
        retenidos: quimico.retenidos,
        productoLiberado: quimico.productoLiberado === "SI" ? "SI" : "NO",
        diasDeVida: quimico.diasDeVida ?? undefined,
        reportadoPorId: quimico.reportadoPorId,
        movimiento: "EDITADO" as Movimiento
      })
    }
  }, [quimico, form])

  useEffect(() => {
    if (session?.user?.id) {
      form.setValue("reportadoPorId", Number(session.user.id))
    }
  }, [session?.user?.id, form])

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      if (!values.ubicacionId || values.ubicacionId === 0) {
        throw new Error("Debes seleccionar una ubicación válida")
      }

      const fechaIngreso = new Date(values.fechaIngreso)
      const fechaVencimiento = new Date(values.fechaVencimiento)

      if (fechaVencimiento <= fechaIngreso) {
        throw new Error("La fecha de vencimiento debe ser posterior a la de ingreso")
      }

      const payload = {
        id: values.id,
        codigo: Number(values.codigo),
        descripcion: values.descripcion,
        noLote: values.noLote,
        proveedores: values.proveedores,
        fechaIngreso: fechaIngreso.toISOString(),
        fechaVencimiento: fechaVencimiento.toISOString(),
        unidadMedidaId: values.unidadMedidaId,
        ubicacionId: Number(values.ubicacionId),
        existenciaFisica: Number(values.existenciaFisica),
        existenciaSistema: Number(values.existenciaSistema),
        retenidos: Number(values.retenidos) || 0,
        productoLiberado: values.productoLiberado,
        diasDeVida: values.diasDeVida ? Number(values.diasDeVida) : undefined,
        reportadoPorId: Number(values.reportadoPorId),
        movimiento: "EDITADO" as Movimiento
      }

      const { data } = await axios.put("/api/quimicos/update", payload)

      if (!data.success) {
        throw new Error(data.error || "Error al actualizar el químico")
      }

      toast({
        title: "✅ Éxito",
        description: "Químico actualizado correctamente",
        variant: "default"
      })

      onSuccess?.()

    } catch (error: any) {
      console.error("Error al actualizar:", error)
      toast({
        title: "❌ Error",
        description: error.response?.data?.error || error.message || "Error desconocido",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem className="hidden">
              <FormControl>
                <Input type="hidden" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="codigo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Código</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  readOnly
                  className="text-black bg-gray-200"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Descripción</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="text-black bg-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="noLote"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Número de Lote</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="text-black bg-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="proveedores"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Proveedor</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="text-black bg-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="existenciaFisica"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Existencia Física</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  className="text-black bg-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="existenciaSistema"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Existencia Sistema</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  className="text-black bg-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="retenidos"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Retenidos</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  className="text-black bg-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fechaIngreso"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Fecha Ingreso</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  className="text-black bg-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fechaVencimiento"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Fecha Vencimiento</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  className="text-black bg-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="unidadMedidaId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Unidad Medida</FormLabel>
              <FormControl>
                <select
                  {...field}
                  value={String(field.value)}
                  onChange={(e) => field.onChange(e.target.value as Unidad_medida)}
                  className="text-black bg-white w-full p-2 rounded border"
                >
                  {Object.values(Unidad_medida).map((unidad) => (
                    <option key={unidad} value={unidad}>
                      {unidad}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ubicacionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Ubicación</FormLabel>
              <FormControl>
                <select
                  {...field}
                  value={String(field.value)}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="text-black bg-white w-full p-2 rounded border"
                >
                  <option value={0}>Seleccione ubicación</option>
                  {ubicaciones.map((ubi) => (
                    <option key={ubi.id} value={ubi.id}>
                      Rack {ubi.rack} - Pos {ubi.posicion}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="productoLiberado"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Producto Liberado</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="text-black bg-white w-full p-2 rounded border"
                >
                  <option value="NO">NO</option>
                  <option value="SI">SI</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reportadoPorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">ID Usuario</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  readOnly
                  value={session?.user?.id ? `${session.user.id} - ${session.user.name}` : "No autenticado"}
                  className="text-black bg-gray-200"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="movimiento"
          render={({ field }) => (
            <FormItem className="hidden">
              <FormControl>
                <Input type="hidden" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="lg:col-span-3 flex justify-center mt-4">
          <Button
            type="submit"
            className="bg-[#1e3a5f] hover:bg-green-600 text-white px-10 py-2 rounded-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Actualizando..." : "Actualizar Químico"}
          </Button>
        </div>
      </form>
    </Form>
  )
}