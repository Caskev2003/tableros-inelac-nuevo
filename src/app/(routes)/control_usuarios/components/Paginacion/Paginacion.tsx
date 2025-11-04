"use client";

import { Button } from "@/components/ui/button";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
};

export default function Paginacion({
  page,
  pageSize,
  total,
  totalPages,
  onChange,
  className = "",
}: Props) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const renderNumbers = () => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return pages.map((p) => {
      const isActive = p === page;
      return (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1 rounded-sm border text-sm font-semibold ${
            isActive
              ? "bg-red-600 text-white border-[#ff6a00]"
              : "bg-white text-black border-gray-300 hover:bg-gray-100"
          }`}
        >
          {p}
        </button>
      );
    });
  };

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full ${className}`}
    >
      {/* Izquierda: “Mostrando registros … de …” */}
      <div className="text-sm text-blue-500 font-medium">
        Mostrando registros <span className="font-semibold">{start}-{end}</span> de{" "}
        <span className="font-semibold">{total}</span>
      </div>

      {/* Derecha: “Página X de Y  [ANTERIOR]  1 2 3  [SIGUIENTE]” */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-blue-500 font-medium">
          Página <strong>{page}</strong> de <strong>{totalPages || 1}</strong>
        </span>

        <Button
          variant="outline"
          className="h-8 px-3 text-sm bg-white border-gray-300 text-black
           hover:bg-gray-100 hover:text-black disabled:opacity-50"
          disabled={!canPrev}
          onClick={() => onChange(page - 1)}
        >
          ANTERIOR
        </Button>

        <div className="flex items-center gap-1">{renderNumbers()}</div>

        <Button
          variant="outline"
          className="h-8 px-3 text-sm ? 'text-gray-500 bg-gray-200 cursor-not-allowed' 
                : 'text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md'"
          disabled={!canNext}
          onClick={() => onChange(page + 1)}
        >
          SIGUIENTE
        </Button>
      </div>
    </div>
  );
}
