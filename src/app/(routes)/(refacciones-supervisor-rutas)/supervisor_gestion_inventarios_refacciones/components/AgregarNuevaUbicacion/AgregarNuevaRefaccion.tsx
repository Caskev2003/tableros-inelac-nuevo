"use client";

import React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

export default function AgregarNuevaUbicacion() {
  const [form, setForm] = useState({ rack: "", posicion: "", fila: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/ubicaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast({
        title: "Ubicación registrada",
        description: "Ubicación agregada correctamente.",
      });
      setForm({ rack: "", posicion: "", fila: "" });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la ubicación.",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-blue-900 text-white hover:bg-green-600 px-6 py-2 rounded-full text-sm sm:text-base">Agregar ubicación</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#2b2b2b]">
        <DialogHeader>
          <DialogTitle>Registrar nueva ubicación</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Input className="bg-white text-black"
            type="number"
            name="rack"
            value={form.rack}
            onChange={handleChange}
            placeholder="Rack"
            required
          />
          <Input className="bg-white text-black"
            type="text"
            name="posicion"
            value={form.posicion}
            onChange={handleChange}
            placeholder="Posición"
            required
          />
          <Input className="bg-white text-black"
            type="text"
            name="fila"
            value={form.fila}
            onChange={handleChange}
            placeholder="Fila"
            required
          />
          <div className="flex justify-end">
            <Button type="submit" className="bg-[#1e3a5f] text-white hover:bg-green-600 h-10 px-10 rounded-full w-full sm:w-auto">
              Agregar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
