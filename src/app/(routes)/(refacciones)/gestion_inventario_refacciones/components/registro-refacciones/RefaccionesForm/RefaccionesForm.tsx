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
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type FormValues = z.infer<typeof refaccionSchema>

interface Props {
  onSuccess?: () => void
}

export function RefaccionesForm({ onSuccess }: Props) {
  const { data: session } = useSession()

  const form = useForm<FormValues>({
    resolver: zodResolver(refaccionSchema),
    defaultValues: {
      codigo: undefined,
      descripcion: "",
      noParte: "",
      proveedores: "",
      fechaIngreso: "",
      unidadMedidaId: "PZ",
      ubicacionId: undefined,
      cantidad: undefined,
      existenciaSistema: undefined,
      reportadoPorId: 0,
    }
  })

  const [ubicaciones, setUbicaciones] = useState<any[]>([])

  const cargarUbicaciones = async () => {
    try {
      const res = await axios.get("/api/ubicaciones/get")
      setUbicaciones(res.data)
    } catch (error) {
      console.error("Error al cargar ubicaciones:", error)
    }
  }

  useEffect(() => { cargarUbicaciones() }, [])

  useEffect(() => {
    const userId = Number(session?.user?.id)
    if (!isNaN(userId)) form.setValue("reportadoPorId", userId)
  }, [session?.user?.id, form])

  const onSubmit = async (values: FormValues) => {
    const payload = { ...values, movimiento: "NUEVO_INGRESO" }
    try {
      await axios.post("/api/refacciones", payload)
      toast({ title: "Refacción registrada correctamente" })
      onSuccess?.()
    } catch (error: any) {
      console.error("Error al registrar:", error)
      toast({
        title: "Error al registrar",
        description: error?.response?.data || "Datos faltantes o inválidos",
        variant: "destructive"
      })
    }
  }

  // ===== Modal "Agregar ubicación" =====
  const [openUbic, setOpenUbic] = useState(false)
  const [formUbic, setFormUbic] = useState({ rack: "", posicion: "", fila: "" })

  const handleChangeUbic = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormUbic({ ...formUbic, [e.target.name]: e.target.value })
  }

  const handleSubmitUbic = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch("/api/ubicaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formUbic),
    })

    if (res.ok) {
      const creada = await res.json()
      toast({ title: "Ubicación registrada", description: "Ubicación agregada correctamente." })
      setFormUbic({ rack: "", posicion: "", fila: "" })
      setOpenUbic(false)
      await cargarUbicaciones()
      if (creada?.id) form.setValue("ubicacionId", Number(creada.id))
    } else {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la ubicación." })
    }
  }
  // =====================================

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {/* Fila 1 y 2 */}
        {[["codigo", "Código"], ["descripcion", "Descripción"], ["noParte", "No. Parte"], ["proveedores", "Proveedor"], ["cantidad", "Cantidad"]]
          .map(([name, label]) => (
            <FormField
              key={name}
              control={form.control}
              name={name as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">{label}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type={name === "codigo" || name === "cantidad" ? "number" : "text"}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        if (name === "codigo" || name === "cantidad") {
                          const value = e.target.value
                          field.onChange(value === "" ? undefined : Number(value))
                        } else {
                          field.onChange(e.target.value)
                        }
                      }}
                      className="text-black bg-white w-full h-10 rounded-md px-3"
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
                <Input type="date" {...field} className="text-black bg-white w-full h-10 rounded-md px-3" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fila 3 */}
        <FormField
          control={form.control}
          name="existenciaSistema"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Existencia en sistema</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const value = e.target.value
                    field.onChange(value === "" ? undefined : Number(value))
                  }}
                  className="text-black bg-white w-full h-10 rounded-md px-3"
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
              <FormLabel className="text-white">Unidad de Medida</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="text-black bg-white w-full h-10 rounded-md p-2 border"
                >
                  <option value="PZ">Pz</option>
                  <option value="KG">Kg</option>
                  <option value="LTS">Lts</option>
                  <option value="MTS">Mts</option>
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
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const value = e.target.value
                    field.onChange(value === "" ? undefined : Number(value))
                  }}
                  className="text-black bg-white w-full h-10 rounded-md p-2 border"
                >
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

        {/* ID Usuario Logueado — AHORA justo debajo, alineado en la primera columna */}
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
                  value={session?.user?.id ? `${session?.user?.id} - ${session?.user?.name}` : ""}
                  className="text-black bg-zinc-500 h-10"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botón Agregar ubicación en su PROPIA FILA, bajo la columna 3 (no afecta alineación) */}
        <div className="col-span-1 sm:col-span-1 lg:col-start-3 flex justify-end">
          <Dialog open={openUbic} onOpenChange={setOpenUbic}>
            <DialogTrigger asChild>
              <Button className="mt-1 bg-[#1e3a5f] text-white hover:bg-green-600 h-10 px-4 rounded-full text-sm w-full sm:w-fit">
                Agregar ubicación
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md bg-[#2b2b2b]">
              <DialogHeader>
                <DialogTitle>Registrar nueva ubicación</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmitUbic} className="space-y-4 mt-2">
                <Input
                  className="bg-white text-black h-10"
                  type="number"
                  name="rack"
                  value={formUbic.rack}
                  onChange={handleChangeUbic}
                  placeholder="Rack"
                  required
                />
                <Input
                  className="bg-white text-black h-10"
                  type="text"
                  name="posicion"
                  value={formUbic.posicion}
                  onChange={handleChangeUbic}
                  placeholder="Fila (Poner 00 si no tiene)"
                  required
                />
                <Input
                  className="bg-white text-black h-10"
                  type="text"
                  name="fila"
                  value={formUbic.fila}
                  onChange={handleChangeUbic}
                  placeholder="Columna"
                  required
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-[#1e3a5f] text-white hover:bg-green-600 h-10 px-10 rounded-full w-full sm:w-auto"
                  >
                    Agregar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Botón registrar */}
        <div className="lg:col-span-3 flex justify-center mt-2">
          <Button type="submit" className="bg-[#1e3a5f] text-white hover:bg-green-600 h-10 px-10 rounded-full">
            Registrar refacción
          </Button>
        </div>
      </form>
    </Form>
  )
}
