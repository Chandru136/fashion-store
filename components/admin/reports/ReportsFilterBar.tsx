"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Download,
  Filter,
  Layers,
  ShoppingBag,
  Package,
  Receipt,
  CreditCard,
  RotateCcw,
  Users,
  Ticket,
} from "lucide-react";
import { ReportDatePicker } from "./ReportDatePicker";

interface ReportsFilterBarProps {
  currentTab: string;
  currentRange: string;
  from?: string;
  to?: string;
  rangeLabel: string;
  stockFilter?: string;
}

const TABS = [
  { id: "sales", label: "Sales Ledger", icon: ShoppingBag },
  { id: "items", label: "Line Items", icon: Layers },
  { id: "gst", label: "GST Compliance", icon: Receipt },
  { id: "inventory", label: "Inventory Valuation", icon: Package },
  { id: "payments", label: "Payments & Reconciliation", icon: CreditCard },
  { id: "refunds", label: "Refunds Audit", icon: RotateCcw },
  { id: "customers", label: "Patron CLV", icon: Users },
  { id: "coupons", label: "Coupons ROI", icon: Ticket },
];

const QUICK_PRESETS = [
  { id: "today", label: "Today" },
  { id: "7days", label: "7 Days" },
  { id: "30days", label: "30 Days" },
  { id: "this_month", label: "This Month" },
  { id: "all", label: "All Time" },
];

export function ReportsFilterBar({
  currentTab,
  currentRange,
  from = "",
  to = "",
  rangeLabel,
  stockFilter = "all",
}: ReportsFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateQuery = (params: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, val]) => {
      if (val) next.set(key, val);
      else next.delete(key);
    });
    next.set("page", "1"); // Reset page when filters change
    router.push(`/admin/reports?${next.toString()}`);
  };

  const handleTabChange = (tabId: string) => {
    updateQuery({ tab: tabId });
  };

  const handleQuickPreset = (presetId: string) => {
    updateQuery({ range: presetId, from: undefined, to: undefined });
  };

  const exportUrl = `/api/admin/reports/export?report=${currentTab}&range=${currentRange}${
    currentRange === "custom" && from ? `&from=${from}` : ""
  }${currentRange === "custom" && to ? `&to=${to}` : ""}${
    currentTab === "inventory" ? `&stockFilter=${stockFilter}` : ""
  }`;

  return (
    <div className="space-y-4">
      {/* Primary Category Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-stone-200 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "wine-gradient-bg text-gold-300 gold-border shadow-sm"
                  : "text-stone-600 bg-white border border-stone-200 hover:bg-stone-50 hover:text-wine-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Date Picker, Quick Presets & CSV Export Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border border-stone-200 bg-ivory-50 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Custom Date Picker Popover */}
          <ReportDatePicker
            currentRange={currentRange}
            from={from}
            to={to}
            rangeLabel={rangeLabel}
          />

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1 border-l border-stone-300 pl-2.5">
            {QUICK_PRESETS.map((preset) => {
              const isSelected = currentRange === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleQuickPreset(preset.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    isSelected
                      ? "bg-wine-900 text-gold-300"
                      : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side controls: Stock Filter & Export Button */}
        <div className="flex items-center gap-3">
          {currentTab === "inventory" && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-stone-600 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Stock:
              </span>
              <select
                value={stockFilter}
                onChange={(e) => updateQuery({ stockFilter: e.target.value })}
                className="text-xs rounded border border-stone-300 bg-white px-2.5 py-1.5 text-stone-700 font-medium"
              >
                <option value="all">All Variants</option>
                <option value="low">Low Stock (≤ 5)</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
          )}

          <a
            href={exportUrl}
            download
            className="inline-flex items-center gap-2 px-4 py-2 wine-gradient-bg text-gold-300 text-xs font-bold rounded-lg gold-border shadow hover:brightness-110 transition-all shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-gold-400" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>
    </div>
  );
}
