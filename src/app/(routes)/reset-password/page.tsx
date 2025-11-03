"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ResetPassword from "@/components/shared/ResetPassword/ResetPassword";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <h2 className="text-2xl font-bold">Token inválido o expirado.</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <ResetPassword token={token} />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Cargando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
