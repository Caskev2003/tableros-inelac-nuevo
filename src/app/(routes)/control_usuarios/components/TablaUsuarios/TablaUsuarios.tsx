"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import EditarUsuario, { type Usuario } from "../EditarUsuario/EditarUsuario";
import Paginacion from "../Paginacion/Paginacion";

interface Props {
  refrescar?: number;
}

type PagedResp = {
  items: Usuario[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function TablaUsuarios({ refrescar }: Props) {
  const { data: session } = useSession();
  const myId = Number(session?.user?.id ?? 0);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<{ id: number; nombre: string } | null>(null);
  const [reassignId, setReassignId] = useState<number | "">("");

  // Modal de edición
  const [openEdit, setOpenEdit] = useState(false);
  const [selected, setSelected] = useState<Usuario | null>(null);

  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10); // 10 por página como pediste
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchUsuarios = async (p = page) => {
    try {
      setLoading(true);
      const { data } = await axios.get<PagedResp>("/api/usuarios/get", {
        params: { page: p, pageSize },
      });
      setUsuarios(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const eliminarUsuario = async (id: number, nombre: string, toId?: number) => {
    try {
      const url = toId
        ? `/api/usuarios/get?id=${id}&toId=${toId}`
        : `/api/usuarios/get?id=${id}`;
      await axios.delete(url);
      toast({
        title: "Usuario eliminado",
        description: `El usuario "${nombre}" fue eliminado correctamente.`,
      });

      // Refresca la página actual; si queda vacía y no es la primera, retrocede una página
      await fetchUsuarios(page);
      if (usuarios.length === 1 && page > 1) {
        await fetchUsuarios(page - 1);
      }
      setReassignId("");
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        "No se pudo eliminar el usuario.";
      toast({ title: "Error al eliminar", description: msg, variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchUsuarios(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (refrescar) fetchUsuarios(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refrescar]);

  return (
    <div className="mt-6 rounded-lg shadow max-w-full">
      {/* ====== Barra superior con info y paginación (fuera de la tabla) ====== */}
      <div className="px-4 pt-4">
        <Paginacion page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onChange={(p) => fetchUsuarios(p)}
          className="mb-3"
        />
      </div>

      {/* ====== Encabezado tabla ====== */}
      <div className="grid grid-cols-6 bg-[#1e3a5f] text-white font-semibold text-sm p-3 sticky top-0 z-10 rounded-t-lg">
        <div>Nombre</div>
        <div>Correo</div>
        <div>Rol</div>
        <div>Teléfono</div>
        <div>Registrado</div>
        <div className="text-center">Acciones</div>
      </div>

      {/* ====== Cuerpo con scroll ====== */}
      <div className="overflow-y-auto divide-y divide-gray-300" style={{ maxHeight: "calc(100vh - 420px)" }}>
        {loading ? (
          <div className="p-6 text-center text-sm text-gray-500">Cargando…</div>
        ) : usuarios.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">Sin resultados</div>
        ) : (
          usuarios.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-6 p-3 text-sm bg-[#424242] text-white hover:bg-gray-400 hover:text-black transition"
            >
              <div className="truncate">{user.nombre ?? "-"}</div>
              <div className="truncate">{user.correo}</div>
              <div className="truncate">{user.rol?.toString().replaceAll("_", " ")}</div>
              <div className="truncate">{user.telefono || "-"}</div>
              <div className="truncate">{new Date((user as any).createdAt).toLocaleString()}</div>

              <div className="flex items-center justify-center gap-2">
                {/* Editar */}
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => {
                    setSelected({
                      id: user.id,
                      nombre: user.nombre ?? "",
                      correo: user.correo,
                      imagen: user.imagen ?? "",
                      rol: user.rol,
                      telefono: user.telefono ?? "",
                    });
                    setOpenEdit(true);
                  }}
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                {/* Eliminar + confirmación + reasignación */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-gradient-to-b from-[#c62828] 80% to-[#9d4245] text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        if (user.id === myId) return; // no abrir si soy yo
                        setUsuarioSeleccionado({
                          id: user.id,
                          nombre: user.nombre ?? user.correo,
                        });
                        setReassignId("");
                      }}
                      title={user.id === myId ? "No puedes eliminar tu propia cuenta" : "Eliminar"}
                      disabled={user.id === myId}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent className="bg-zinc-900">
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Estás a punto de eliminar a <strong>{usuarioSeleccionado?.nombre}</strong>.
                        <br />
                        Si tiene registros asociados, debes reasignarlos a otro usuario.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Reasignar a</label>
                      <select
                        className="w-full rounded-md border px-3 py-2 text-sm text-white"
                        value={reassignId}
                        onChange={(e) => setReassignId(e.target.value ? Number(e.target.value) : "")}
                      >
                        <option className="text-black" value="">
                          (Opcional) Selecciona usuario destino
                        </option>
                        {usuarios
                          .filter((u) => u.id !== usuarioSeleccionado?.id)
                          .map((u) => (
                            <option className="text-black" key={u.id} value={u.id}>
                              {u.nombre ? `${u.nombre} · ${u.correo}` : u.correo}
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-gray-300">
                        Si tiene registros, selecciona un nuevo usuario para transferirlos.
                      </p>
                    </div>

                    <AlertDialogFooter>
                      <AlertDialogCancel className="hover:bg-white hover:text-black transition-all">
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-500 hover:bg-red-700"
                        onClick={() => {
                          if (usuarioSeleccionado) {
                            eliminarUsuario(
                              usuarioSeleccionado.id,
                              usuarioSeleccionado.nombre,
                              reassignId === "" ? undefined : Number(reassignId)
                            );
                          }
                        }}
                      >
                        Sí, eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de edición */}
      {selected && (
        <EditarUsuario
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          user={selected}
          endpoint="/api/usuarios/update"
          onUpdated={() => {
            toast({ title: "Usuario actualizado" });
            fetchUsuarios(page);
          }}
        />
      )}
    </div>
  );
}
