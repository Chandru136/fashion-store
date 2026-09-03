"use client";

import { Printer } from "lucide-react";

export function PrintOrderButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-4 py-2 bg-white border border-stone-300 text-stone-800 font-bold text-xs rounded hover:border-gold-500 flex items-center gap-1.5 shadow-sm"
    >
      <Printer className="w-4 h-4 text-wine-800" /> Print Tax Invoice
    </button>
  );
}
