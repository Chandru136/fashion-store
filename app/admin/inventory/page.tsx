import React from "react";
import { getInventoryOverview } from "@/lib/services/inventory.service";
import { Boxes, AlertTriangle, CheckCircle, Package } from "lucide-react";
import { StockUpdateModalClient } from "./StockUpdateModalClient";

export default async function AdminInventoryPage() {
  const overview = await getInventoryOverview();

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="font-serif text-3xl font-bold text-wine-900">Inventory Ledger & Stock Alerts</h1>
        <p className="text-xs text-stone-500 mt-1">Track available vs reserved stock and adjust stock thresholds to prevent overselling.</p>
      </div>

      {/* Stock Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 text-xs">
        <div className="p-5 bg-white rounded-xl border gold-border space-y-1 shadow-sm">
          <span className="text-stone-500 font-bold uppercase tracking-wider">Total Available Stock</span>
          <p className="font-serif text-2xl font-bold text-wine-900">{overview.totalAvailable.toLocaleString()} units</p>
        </div>
        <div className="p-5 bg-white rounded-xl border border-stone-200 space-y-1 shadow-sm">
          <span className="text-stone-500 font-bold uppercase tracking-wider">Reserved in Orders</span>
          <p className="font-serif text-2xl font-bold text-blue-800">{overview.totalReserved.toLocaleString()} units</p>
        </div>
        <div className="p-5 bg-amber-50 rounded-xl border border-amber-200 space-y-1 shadow-sm">
          <span className="text-amber-800 font-bold uppercase tracking-wider">Low Stock Warnings</span>
          <p className="font-serif text-2xl font-bold text-amber-900">{overview.lowStockCount} SKUs</p>
        </div>
        <div className="p-5 bg-red-50 rounded-xl border border-red-200 space-y-1 shadow-sm">
          <span className="text-red-800 font-bold uppercase tracking-wider">Out of Stock</span>
          <p className="font-serif text-2xl font-bold text-red-900">{overview.outOfStockCount} SKUs</p>
        </div>
      </div>

      {/* Inventory Table with Quick Adjustment Modal */}
      <div className="p-6 bg-white rounded-xl border border-stone-200 shadow-sm space-y-4">
        <h2 className="font-serif font-bold text-wine-900 text-lg">Variant Stock Table</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider">
                <th className="p-3">Product Name</th>
                <th className="p-3">Variant SKU</th>
                <th className="p-3">Color / Size</th>
                <th className="p-3">Available Stock</th>
                <th className="p-3">Reserved</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Quick Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {overview.items.map((item) => (
                <tr key={item.id} className="hover:bg-ivory-50 transition-colors">
                  <td className="p-3 font-bold text-wine-900">{item.productName}</td>
                  <td className="p-3 font-mono text-stone-700">{item.sku}</td>
                  <td className="p-3 text-stone-600">{item.color || "—"} {item.size ? `(${item.size})` : ""}</td>
                  <td className="p-3 font-bold text-base text-wine-900">{item.availableStock}</td>
                  <td className="p-3 font-semibold text-blue-700">{item.reservedStock}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      item.status === "OUT_OF_STOCK"
                        ? "bg-red-100 text-red-800"
                        : item.status === "LOW_STOCK"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {item.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <StockUpdateModalClient variantId={item.variantId} currentStock={item.availableStock} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
