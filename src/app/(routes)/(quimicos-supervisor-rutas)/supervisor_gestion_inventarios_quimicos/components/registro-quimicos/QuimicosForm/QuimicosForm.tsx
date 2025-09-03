"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { quimicoSchema } from "./QuimicosForm.form"
import { z } from "zod"
import axios from "axios"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Unidad_medida } from "@prisma/client"

type FormValues = z.infer<typeof quimicoSchema>

interface Props {
  onSuccess?: () => void
}

export function QuimicosForm({ onSuccess }: Props) {
  const { data: session } = useSession()
  const [ubicaciones, setUbicaciones] = useState<any[]>([])
  const [loadingUbicaciones, setLoadingUbicaciones] = useState(true)
  const [errorUbicaciones, setErrorUbicaciones] = useState('')

  const form = useForm<FormValues>({
    resolver: zodResolver(quimicoSchema),
    defaultValues: {
      codigo: 0,
      descripcion: "",
      noLote: "",
      proveedores: "",
      fechaIngreso: "",
      fechaVencimiento: "",
      unidadMedidaId: "KG",
      ubicacionId: 0,
      existenciaSistema: 0,
      cantidad: 0,
      retenidos: 0,
      productoLiberado: "NO",
      reportadoPorId: 0
    }
  })

  // Función para manejar el cambio en campos numéricos
  const handleNumberChange = (field: any, value: string) => {
    if (value === "" || isNaN(Number(value))) {
      field.onChange(0); // Establecer a 0 si está vacío o no es número
    } else {
      field.onChange(Number(value));
    }
  };

  // Cargar ubicaciones al montar el componente
  useEffect(() => {
    const fetchUbicaciones = async () => {
      try {
        setLoadingUbicaciones(true)
        const res = await axios.get("/api/ubicaciones/get")
        if (res.data && res.data.length > 0) {
          setUbicaciones(res.data)
        } else {
          setErrorUbicaciones("No se encontraron ubicaciones")
          toast({
            title: "Advertencia",
            description: "No hay ubicaciones disponibles",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("Error al cargar ubicaciones:", error)
        setErrorUbicaciones("Error al cargar ubicaciones")
        toast({
          title: "Error",
          description: "No se pudieron cargar las ubicaciones",
          variant: "destructive"
        })
      } finally {
        setLoadingUbicaciones(false)
      }
    }

    fetchUbicaciones()
  }, [])

  // Establecer el ID del usuario logueado
  useEffect(() => {
    if (session?.user?.id) {
      const userId = Number(session.user.id)
      if (!isNaN(userId)) {
        form.setValue("reportadoPorId", userId)
      }
    }
  }, [session?.user?.id, form])

  const onSubmit = async (values: FormValues) => {
    try {
      // Validaciones adicionales
      if (!values.ubicacionId || values.ubicacionId === 0) {
        toast({
          title: "Error",
          description: "Debes seleccionar una ubicación válida",
          variant: "destructive"
        })
        return
      }

      // Preparar payload
      const payload = {
        ...values,
        movimiento: "NUEVO_INGRESO",
        codigo: Number(values.codigo),
        ubicacionId: Number(values.ubicacionId),
        reportadoPorId: Number(values.reportadoPorId),
        existenciaSistema: Number(values.existenciaSistema),
        cantidad: Number(values.cantidad),
        retenidos: Number(values.retenidos) || 0,
        // Convertir fechas a formato ISO
        fechaIngreso: new Date(values.fechaIngreso).toISOString(),
        fechaVencimiento: new Date(values.fechaVencimiento).toISOString()
      }

      console.log("Enviando datos:", payload)

      // Enviar al servidor
      const res = await axios.post("/api/quimicos", payload)

      if (res.data.success) {
        toast({
          title: "Éxito",
          description: "Químico registrado correctamente",
          variant: "default"
        })
        onSuccess?.()
        form.reset()
      } else {
        throw new Error(res.data.error || "Error desconocido del servidor")
      }
    } catch (error: any) {
      console.error("Error al registrar:", error)
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "Error desconocido al registrar el químico"
      
      toast({
        title: "Error",
        description: errorMessage,
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
        {/* Campo Código */}
        <FormField
          control={form.control}
          name="codigo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Código</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={field.value || ""}
                  onChange={(e) => handleNumberChange(field, e.target.value)}
                  className="text-black bg-white w-full rounded-md px-3 py-2"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Descripción */}
        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Descripción</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="text-black bg-white w-full rounded-md px-3 py-2"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Número de Lote */}
        <FormField
          control={form.control}
          name="noLote"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Número de Lote</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="text-black bg-white w-full rounded-md px-3 py-2"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Proveedor */}
        <FormField
          control={form.control}
          name="proveedores"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Proveedor</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="text-black bg-white w-full rounded-md px-3 py-2"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Cantidad */}
        <FormField
          control={form.control}
          name="cantidad"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Cantidad</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={field.value || ""}
                  onChange={(e) => handleNumberChange(field, e.target.value)}
                  className="text-black bg-white w-full rounded-md px-3 py-2"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Retenidos */}
        <FormField
          control={form.control}
          name="retenidos"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Retenidos</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={field.value || ""}
                  onChange={(e) => handleNumberChange(field, e.target.value)}
                  className="text-black bg-white w-full rounded-md px-3 py-2"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Fecha de Ingreso */}
        <FormField
          control={form.control}
          name="fechaIngreso"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Fecha de Ingreso</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  className="text-black bg-white w-full rounded-md px-3 py-2"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Fecha de Vencimiento */}
        <FormField
          control={form.control}
          name="fechaVencimiento"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Fecha de Vencimiento</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  className="text-black bg-white w-full rounded-md px-3 py-2"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Existencia en Sistema */}
        <FormField
          control={form.control}
          name="existenciaSistema"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Existencia en sistema</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={field.value || ""}
                  onChange={(e) => handleNumberChange(field, e.target.value)}
                  className="text-black bg-white w-full rounded-md px-3 py-2"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Unidad de Medida */}
        <FormField
          control={form.control}
          name="unidadMedidaId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Unidad de Medida</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="text-black bg-white w-full rounded-md p-2 border"
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

        {/* Campo Ubicación */}
        <FormField
          control={form.control}
          name="ubicacionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Ubicación</FormLabel>
              <FormControl>
                <select
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="text-black bg-white w-full rounded-md p-2 border"
                  disabled={loadingUbicaciones || errorUbicaciones !== ''}
                >
                  <option value={0}>Selecciona una ubicación</option>
                  {loadingUbicaciones ? (
                    <option disabled>Cargando ubicaciones...</option>
                  ) : errorUbicaciones ? (
                    <option disabled>{errorUbicaciones}</option>
                  ) : (
                    ubicaciones.map((ubi) => (
                      <option key={ubi.id} value={ubi.id}>
                        Rack {ubi.rack} - Fila {ubi.fila} - Posición {ubi.posicion}
                      </option>
                    ))
                  )}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Producto Liberado */}
        <FormField
          control={form.control}
          name="productoLiberado"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Producto Liberado</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="text-black bg-white w-full rounded-md p-2 border"
                >
                  <option value="NO">NO</option>
                  <option value="SI">SI</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo ID Usuario (solo lectura) */}
        <FormField
          control={form.control}
          name="reportadoPorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">ID Usuario Logueado</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  readOnly
                  value={session?.user?.id ? `${session.user.id} - ${session.user.name}` : "No autenticado"}
                  className="text-black bg-zinc-500"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botón de Submit */}
        <div className="lg:col-span-3 flex justify-center mt-4">
          <Button
            type="submit"
            className="bg-[#1e3a5f] text-white hover:bg-green-600 h-10 px-10 rounded-full w-full sm:w-auto"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Registrando..." : "Registrar Químico"}
          </Button>
        </div>
      </form>
    </Form>
  )
}