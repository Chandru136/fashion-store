"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { PaginationMeta } from "@/lib/services/report.service";

interface ReportPaginationProps {
  pagination: PaginationMeta;
}

export function ReportPagination({ pagination }: ReportPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    totalCount,
    totalPages,
    currentPage,
    pageSize,
    hasNextPage,
    hasPrevPage,
  } = pagination;

  const [jumpPage, setJumpPage] = useState("");

  const updatePagination = (page: number, newPageSize?: number) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(page));
    if (newPageSize) {
      next.set("pageSize", String(newPageSize));
    }
    router.push(`/admin/reports?${next.toString()}`);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSize = Number(e.target.value);
    updatePagination(1, nextSize);
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(jumpPage);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      updatePagination(target);
      setJumpPage("");
    }
  };

  if (totalCount === 0) return null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  // Generate page numbers array with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-t border-stone-200 bg-ivory-50 text-xs text-stone-600">
      {/* Records Info & Page Size Selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-medium text-stone-700">
          Showing <strong className="text-wine-900 font-bold">{startRecord}</strong> to{" "}
          <strong className="text-wine-900 font-bold">{endRecord}</strong> of{" "}
          <strong className="text-wine-900 font-bold">{totalCount}</strong> records
        </span>

        <div className="flex items-center gap-1.5 border-l border-stone-300 pl-3">
          <span className="text-[11px] text-stone-500">Per page:</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="rounded border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-800 shadow-sm focus:border-gold-500 focus:outline-none"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* First Button */}
        <button
          type="button"
          onClick={() => updatePagination(1)}
          disabled={!hasPrevPage}
          className="p-1.5 rounded border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="First Page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Prev Button */}
        <button
          type="button"
          onClick={() => updatePagination(currentPage - 1)}
          disabled={!hasPrevPage}
          className="p-1.5 rounded border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <span key={`ellipsis-${index}`} className="px-1 text-stone-400 select-none">
                  …
                </span>
              );
            }

            const isCurrent = page === currentPage;
            return (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => updatePagination(page as number)}
                className={`min-w-[28px] h-7 px-2 rounded text-xs font-bold transition-all ${
                  isCurrent
                    ? "wine-gradient-bg text-gold-300 gold-border shadow-sm"
                    : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 hover:text-wine-900"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => updatePagination(currentPage + 1)}
          disabled={!hasNextPage}
          className="p-1.5 rounded border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Button */}
        <button
          type="button"
          onClick={() => updatePagination(totalPages)}
          disabled={!hasNextPage}
          className="p-1.5 rounded border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Last Page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>

        {/* Jump to Page Form */}
        {totalPages > 3 && (
          <form onSubmit={handleJumpSubmit} className="flex items-center gap-1 ml-2 border-l border-stone-300 pl-2">
            <span className="text-[11px] text-stone-500">Go to:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              placeholder={`${currentPage}`}
              className="w-10 px-1 py-1 rounded border border-stone-300 bg-white text-center text-xs shadow-sm focus:border-gold-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-2 py-1 bg-stone-200 hover:bg-wine-900 hover:text-gold-300 text-stone-700 font-bold rounded text-[11px] transition-colors"
            >
              Go
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
