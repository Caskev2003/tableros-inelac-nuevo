"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [correo, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        body: JSON.stringify({ correo }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true); 
      } else {
        toast({
          title: "Error",
          description: data.message || "No se pudo enviar el correo",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Error inesperado.",
        variant: "destructive",
      });
    }
  };

  if (success) {
    return (
      <div className="px-6 md:px-8 py-6 md:py-8 rounded-2xl shadow-lg max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg text-center bg-black text-white p-6">
        <h2 className="text-3xl font-bold mb-4 text-cyan-400">¡Enlace enviado!</h2>
        <p className="mb-8 text-center">
          Te hemos enviado un correo para restablecer tu contraseña.<br />
          Revisa tu bandeja de entrada o la carpeta de spam.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="bg-cyan-400 hover:bg-cyan-500 text-black font-bold py-2 px-6 rounded-md"
        >
          Volver al login
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white/80 rounded-lg w-full max-w-md mx-auto mt-20">
      <h2 className="text-2xl font-bold mb-6 text-black text-center">Recuperar contraseña</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Ingresa tu correo"
          value={correo}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 rounded-md border text-black border-gray-400"
        />
        <button
          type="submit"
          className="w-full bg-[#1e3a5f] text-white hover:text-black  hover:bg-green-700 h-10 p-2 rounded-2xl font-semibold"
        >
          Enviar enlace
        </button>
      </form>
    </div>
  );
}
