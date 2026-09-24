"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  X,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface ReportDatePickerProps {
  currentRange: string;
  from?: string;
  to?: string;
  rangeLabel: string;
}

const PRESET_OPTIONS = [
  { id: "today", label: "Today", desc: "Current day until now" },
  { id: "yesterday", label: "Yesterday", desc: "Previous 24-hour cycle" },
  { id: "7days", label: "Last 7 Days", desc: "Past 1 week" },
  { id: "30days", label: "Last 30 Days", desc: "Past 1 month" },
  { id: "90days", label: "Last 90 Days", desc: "Past 1 quarter" },
  { id: "this_month", label: "This Month", desc: "1st of current month" },
  { id: "last_month", label: "Last Month", desc: "Entire previous month" },
  { id: "fy", label: "Financial Year", desc: "April 1 to March 31" },
  { id: "all", label: "All Time", desc: "Entire database ledger" },
  { id: "custom", label: "Custom Window", desc: "Specify start & end dates" },
];

export function ReportDatePicker({
  currentRange,
  from = "",
  to = "",
  rangeLabel,
}: ReportDatePickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState(currentRange);
  const [startDate, setStartDate] = useState(from);
  const [endDate, setEndDate] = useState(to);
  const [validationError, setValidationError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state when URL props change
  useEffect(() => {
    setSelectedRange(currentRange);
    setStartDate(from);
    setEndDate(to);
  }, [currentRange, from, to]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const updateRangeInUrl = (rangeId: string, customFrom?: string, customTo?: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("range", rangeId);
    next.set("page", "1"); // Reset pagination on timeframe change

    if (rangeId === "custom") {
      if (customFrom) next.set("from", customFrom);
      else next.delete("from");

      if (customTo) next.set("to", customTo);
      else next.delete("to");
    } else {
      next.delete("from");
      next.delete("to");
    }

    router.push(`/admin/reports?${next.toString()}`);
    setIsOpen(false);
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedRange(presetId);
    if (presetId !== "custom") {
      updateRangeInUrl(presetId);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setValidationError("Start date cannot be after end date.");
      return;
    }
    setValidationError(null);
    updateRangeInUrl("custom", startDate, endDate);
  };

  const handleQuickMonthStart = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const today = now.toISOString().slice(0, 10);
    setStartDate(firstDay);
    setEndDate(today);
    setSelectedRange("custom");
    setValidationError(null);
  };

  const handleQuickYearStart = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
    const today = now.toISOString().slice(0, 10);
    setStartDate(firstDay);
    setEndDate(today);
    setSelectedRange("custom");
    setValidationError(null);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-gold-500/50"
        aria-expanded={isOpen}
      >
        <CalendarIcon className="w-4 h-4 text-wine-900" />
        <span>Timeframe:</span>
        <span className="font-bold text-wine-900 bg-gold-400/20 px-2 py-0.5 rounded text-[11px] border border-gold-300">
          {rangeLabel}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-[340px] sm:w-[480px] rounded-xl border border-stone-200 bg-ivory-50 shadow-2xl z-50 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-wine-900 to-wine-800 text-gold-300 flex items-center justify-between gold-border border-b">
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>Select Reporting Timeframe</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-ivory-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Quick Presets Grid */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-2">
                Quick Selection Presets
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {PRESET_OPTIONS.map((preset) => {
                  const isSelected = selectedRange === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset.id)}
                      className={`text-left px-2.5 py-1.5 rounded-lg border transition-all ${
                        isSelected
                          ? "wine-gradient-bg text-gold-300 gold-border font-bold shadow-sm"
                          : "bg-white border-stone-200 text-stone-700 hover:bg-stone-100 hover:text-wine-900"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{preset.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-gold-400 shrink-0 ml-1" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Range Picker Section */}
            {(selectedRange === "custom" || currentRange === "custom") && (
              <form onSubmit={handleApplyCustom} className="pt-3 border-t border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-wine-900">
                    Custom Date Range
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleQuickMonthStart}
                      className="text-[10px] text-wine-900 underline hover:text-gold-700"
                    >
                      Month to Date
                    </button>
                    <span className="text-stone-300">·</span>
                    <button
                      type="button"
                      onClick={handleQuickYearStart}
                      className="text-[10px] text-wine-900 underline hover:text-gold-700"
                    >
                      Year to Date
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex flex-col gap-1 text-stone-700 font-semibold text-[11px]">
                    From (Start Date):
                    <input
                      type="date"
                      value={startDate}
                      max={endDate || undefined}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setValidationError(null);
                      }}
                      className="rounded border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-800 shadow-sm focus:border-gold-500 focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-stone-700 font-semibold text-[11px]">
                    To (End Date):
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setValidationError(null);
                      }}
                      className="rounded border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-800 shadow-sm focus:border-gold-500 focus:outline-none"
                    />
                  </label>
                </div>

                {validationError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 font-medium">
                    {validationError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                      setValidationError(null);
                    }}
                    className="px-3 py-1.5 rounded border border-stone-300 bg-white text-stone-600 hover:bg-stone-50 font-semibold text-xs flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 wine-gradient-bg text-gold-300 font-bold rounded gold-border shadow hover:brightness-110 text-xs"
                  >
                    Apply Window
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
