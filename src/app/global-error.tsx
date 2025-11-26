// src/app/global-error.tsx
"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error("❌ Error global en la app:", error)

  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-[#111827] text-white">
        <div className="bg-[#1f2937] rounded-xl p-6 max-w-md w-full shadow-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-3">
            Ocurrió un error en la aplicación
          </h2>

          {/* Mensaje técnico (opcional) */}
          <p className="text-sm text-gray-300 mb-4">
            {error.message || "No se pudo completar la operación."}
          </p>

          <p className="text-xs text-gray-400 mb-6">
            Si el problema persiste, toma una captura de pantalla y repórtalo al área de TI.
          </p>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => reset()}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm"
            >
              Volver a intentar
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
