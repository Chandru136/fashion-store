"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Check } from "lucide-react";
import { updateStockAction } from "@/app/actions/admin.actions";

export function StockUpdateModalClient({ variantId, currentStock }: { variantId: string; currentStock: number }) {
  const [stock, setStock] = useState(currentStock);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setIsLoading(true);
    await updateStockAction(variantId, Number(stock));
    setIsLoading(false);
    setIsEditing(false);
    router.refresh();
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="px-3 py-1 bg-white border border-stone-300 text-wine-900 rounded font-semibold text-[11px] hover:border-gold-500 flex items-center gap-1 ml-auto"
      >
        <Edit2 className="w-3 h-3 text-gold-600" /> Update
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 justify-end">
      <input
        type="number"
        value={stock}
        onChange={(e) => setStock(Number(e.target.value))}
        className="w-16 px-2 py-1 border border-gold-500 rounded text-xs font-bold text-wine-900 focus:outline-none"
      />
      <button
        onClick={handleSave}
        disabled={isLoading}
        className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
        title="Save Stock Level"
      >
        <Check className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
