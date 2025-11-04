"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// shadcn/ui
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";

// (Opcional) tu hook de toast si lo usas
// import { useToast } from "@/hooks/use-toast";

const ROLES = [
  "ADMINISTRADOR",
  "SUPERVISOR_REFACCIONES",
  "SUPERVISOR_QUIMICOS",
  "DESPACHADOR",
] as const;

const userEditSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(120),
  correo: z.string().email("Correo inválido"),
  telefono: z.string().trim().optional().or(z.literal("")),
  imagen: z.string().url("URL inválida").optional().or(z.literal("")),
  rol: z.enum(ROLES),
});
type UserEditValues = z.infer<typeof userEditSchema>;

export type Usuario = {
  id: number;
  nombre: string | null;
  correo: string;
  imagen?: string | null;
  rol: typeof ROLES[number];
  telefono?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  user: Usuario;
  /** Ruta de tu API que recibe PUT ?id= (ej. "/api/usuario" o "/api/users") */
  endpoint: string;
  /** callback para refrescar tabla/lista al guardar */
  onUpdated?: (u: Usuario) => void;
};

export default function EditarUsuario({
  open,
  onClose,
  user,
  endpoint,
  onUpdated,
}: Props) {
  // const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<UserEditValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      nombre: user.nombre ?? "",
      correo: user.correo,
      telefono: user.telefono ?? "",
      imagen: user.imagen ?? "",
      rol: user.rol,
    },
    mode: "onChange",
  });

  React.useEffect(() => {
    // rehidrata cuando cambie el usuario
    form.reset({
      nombre: user.nombre ?? "",
      correo: user.correo,
      telefono: user.telefono ?? "",
      imagen: user.imagen ?? "",
      rol: user.rol,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  async function onSubmit(values: UserEditValues) {
    try {
      setLoading(true);
      setServerError(null);

      // Lo que tu API espera: PUT ?id= con JSON (sin password ni repeat)
      const res = await fetch(`${endpoint}?id=${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error ${res.status}`);
      }

      const updated: Usuario = await res.json();

      // toast?.({ title: "Usuario actualizado", description: `${updated.nombre ?? updated.correo}` });
      onUpdated?.(updated);
      onClose();
    } catch (err: any) {
      const msg = err?.message || "Error actualizando usuario";
      setServerError(msg);
      // toast?.({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="sm:max-w-lg bg-[#2b2b2b]">
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription className="text-gray-300">
            Modifica los datos del usuario. La contraseña puedes cambiarla en la opción olvide mi contraseña en el login.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <Input className="text-black bg-white"
                id="nombre"
                placeholder="Nombre completo"
                {...form.register("nombre")}
              />
              {form.formState.errors.nombre && (
                <p className="text-sm text-red-600">{form.formState.errors.nombre.message}</p>
              )}
            </div>

            {/* Correo */}
            <div className="space-y-1.5">
              <Label htmlFor="correo">Correo</Label>
              <Input className="text-black bg-white"
                id="correo"
                type="email"
                placeholder="usuario@dominio.com"
                {...form.register("correo")}
              />
              {form.formState.errors.correo && (
                <p className="text-sm text-red-600">{form.formState.errors.correo.message}</p>
              )}
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input className="text-black bg-white"
                id="telefono"
                placeholder="Ej. 962-xxx-xxxx"
                {...form.register("telefono")}
              />
              {form.formState.errors.telefono && (
                <p className="text-sm text-red-600">{form.formState.errors.telefono.message}</p>
              )}
            </div>

            {/* Imagen (URL) */}
            <div className="space-y-1.5">
              <Label htmlFor="imagen">URL imagen</Label>
              <Input className="text-black bg-white"
                id="imagen"
                placeholder="https://..."
                {...form.register("imagen")}
              />
              {form.formState.errors.imagen && (
                <p className="text-sm text-red-600">{form.formState.errors.imagen.message}</p>
              )}
            </div>

            {/* Rol */}
            <div className="space-y-1.5 md:col-span-2 ">
              <Label>Rol</Label>
              <Select
                onValueChange={(v) => form.setValue("rol", v as UserEditValues["rol"], { shouldValidate: true })}
                defaultValue={form.getValues("rol")}
              >
                <SelectTrigger className="text-black bg-white">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent className="text-black bg-white">
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.rol && (
                <p className="text-sm text-red-600">{form.formState.errors.rol.message}</p>
              )}
            </div>
          </div>

          {serverError && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button className="h-10 text-white hover:text-black px-4 py-2 rounded-2xl text-sm sm:text-base font-semibold
             transition-all duration-200 hover:bg-gradient-to-b hover:bg-white" 
             type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button className="h-10 text-white px-4 py-2 rounded-2xl text-sm sm:text-base 
              font-semibold bg-[#426689] transition-all duration-200 hover:bg-gradient-to-b hover:from-green-700 hover:to-green-500"
             type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
