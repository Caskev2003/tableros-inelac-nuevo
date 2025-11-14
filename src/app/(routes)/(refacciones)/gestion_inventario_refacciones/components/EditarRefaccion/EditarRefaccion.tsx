"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { refaccionSchema } from "./RefaccionesForm.form"
import { z } from "zod"
import axios from "axios"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useEffect } from "react"
import { useSession } from "next-auth/react"

type FormValues = z.infer<typeof refaccionSchema>

interface Props {
  refaccion?: FormValues
  ubicaciones: any[] // ✅ ubicaciones ahora viene del padre
  onSuccess?: () => void
}

export function EditarRefaccion({ refaccion, ubicaciones, onSuccess }: Props) {
  const { data: session } = useSession()

  const form = useForm<FormValues>({
    resolver: zodResolver(refaccionSchema),
    defaultValues: {
      codigo: 0,
      descripcion: "",
      noParte: "",
      proveedores: "",
      fechaIngreso: "",
      unidadMedidaId: "PZ",
      ubicacionId: 0,
      cantidad: 1,
      existenciaSistema: 0,
      reportadoPorId: 0,
    }
  })

  useEffect(() => {
    if (refaccion) {
      form.reset({
        ...refaccion,
        fechaIngreso: new Date(refaccion.fechaIngreso).toISOString().split("T")[0]
      })
    }
  }, [refaccion])

  useEffect(() => {
    const userId = Number(session?.user?.id)
    if (!isNaN(userId) && userId > 0) {
      form.setValue("reportadoPorId", userId)
    }
  }, [session?.user?.id])

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      movimiento: "EDITADO"
    }

    try {
      await axios.put("/api/refacciones/update", payload)
      toast({ title: "Refacción actualizada correctamente" })
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Error al actualizar",
        description: error?.response?.data || "Datos faltantes o inválidos",
        variant: "destructive"
      })
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {["codigo", "descripcion", "noParte", "proveedores", "cantidad"].map((name) => (
            <FormField
                key={name}
                control={form.control}
                name={name as keyof FormValues}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-white capitalize">{name}</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    readOnly={name === "codigo"}
                                    className={`text-black bg-white w-full rounded-md px-3 py-2 ${name === "codigo" ? "bg-gray-500 cursor-not-allowed" : ""}`}
                                />
                            </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        ))}

        <FormField
          control={form.control}
          name="fechaIngreso"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Fecha de Ingreso</FormLabel>
              <FormControl>
                <Input type="date" {...field} className="text-black bg-white" />
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
              <FormLabel className="text-white">Existencia en sistema</FormLabel>
              <FormControl>
                <Input type="number" {...field} className="text-black bg-white" />
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
              <FormLabel className="text-white">Unidad</FormLabel>
              <FormControl>
                <select {...field} className="text-black bg-white w-full p-2 rounded border">
                  <option value="PZ">PZ</option>
                  <option value="KG">KG</option>
                  <option value="LTS">LTS</option>
                  <option value="MTS">MTS</option>
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
                <select {...field} className="text-black bg-white w-full p-2 rounded border">
                  <option value="">Selecciona una ubicación</option>
                  {ubicaciones.map((ubi: any) => (
                    <option key={ubi.id} value={ubi.id}>
                      Rack {ubi.rack} - Columna {ubi.fila} 
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="lg:col-span-3 flex justify-center mt-4">
          <Button type="submit" className="bg-[#1e3a5f] text-white hover:bg-green-600 h-10 px-10 rounded-full w-full sm:w-auto">
            Guardar cambios
          </Button>
        </div>
      </form>
    </Form>
  )
}
