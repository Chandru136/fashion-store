"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { bulkCreateProductsAction, BulkUploadSummary } from "@/app/actions/bulk-product.actions";
import { BULK_UPLOAD_COLUMNS } from "@/lib/validations/bulk-product";
import { Download, Upload, CheckCircle, XCircle, ArrowRight } from "lucide-react";

const TEMPLATE_EXAMPLE_ROW = {
  title: "Maharani Pure Kanchipuram Silk Saree",
  sku: "SC-DEMO-001",
  category: "Pure Silk Sarees",
  brand: "Mayura Silks",
  mrp: 24999,
  sellingPrice: 18999,
  tax: 5,
  fabric: "Pure Mulberry Silk",
  occasion: "Wedding",
  pattern: "Traditional Zari Border",
  status: "ACTIVE",
  featured: "TRUE",
  bestseller: "FALSE",
  newArrival: "TRUE",
  shortDescription: "Authentic pure silk wedding saree.",
  description: "Handcrafted pure mulberry silk saree with certified gold zari border, woven by master artisans.",
  imageUrls: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800, https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800",
  variantSku: "SC-DEMO-001-FREE",
  color: "Royal Red",
  size: "Free Size",
  stock: 25,
};

function downloadTemplate() {
  const worksheet = XLSX.utils.json_to_sheet([TEMPLATE_EXAMPLE_ROW], { header: [...BULK_UPLOAD_COLUMNS] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
  XLSX.writeFile(workbook, "product-bulk-upload-template.xlsx");
}

export default function BulkUploadClient() {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summary, setSummary] = useState<BulkUploadSummary | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setSummary(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const parsedRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

        if (parsedRows.length === 0) {
          setParseError("No rows found in the uploaded file.");
          return;
        }

        setRows(parsedRows);
      } catch (err) {
        setParseError("Could not read this file. Make sure it's a valid .xlsx or .csv file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async () => {
    if (rows.length === 0) return;
    setIsSubmitting(true);
    setSummary(null);

    try {
      // SheetJS-parsed rows can contain non-plain values (e.g. Date objects
      // for date-formatted cells) that Next.js Server Actions reject with
      // "Only plain objects can be passed to Server Functions". Round-tripping
      // through JSON strips anything non-serializable and guarantees plain
      // objects reach the server.
      const plainRows = JSON.parse(JSON.stringify(rows));
      const result = await bulkCreateProductsAction(plainRows);
      setSummary(result);
      if (result.successCount > 0) {
        router.refresh();
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewColumns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="space-y-6">
      {/* Step 1: Download template */}
      <div className="p-5 bg-white rounded-xl border border-stone-200 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-wine-900 text-sm">1. Download the template</h3>
          <p className="text-xs text-stone-500 mt-1">
            Fill in one row per product. Category and Brand are matched by name — new ones are created automatically if they don't exist yet.
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-stone-300 text-wine-900 font-bold text-xs rounded uppercase tracking-wider hover:border-gold-500 hover:bg-ivory-50"
        >
          <Download className="w-4 h-4" /> Download Template (.xlsx)
        </button>
      </div>

      {/* Step 2: Upload */}
      <div className="p-5 bg-white rounded-xl border border-stone-200 space-y-3">
        <h3 className="font-bold text-wine-900 text-sm">2. Upload your completed file</h3>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="w-full rounded border border-stone-300 px-3 py-2 text-xs file:mr-3 file:rounded file:border-0 file:bg-wine-900 file:px-3 file:py-2 file:text-xs file:font-bold file:text-gold-300"
        />
        {fileName && <p className="text-xs text-stone-500">Loaded: {fileName} ({rows.length} row{rows.length === 1 ? "" : "s"})</p>}
        {parseError && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded border border-red-200">{parseError}</div>
        )}
      </div>

      {/* Step 3: Preview */}
      {rows.length > 0 && !summary && (
        <div className="p-5 bg-white rounded-xl border border-stone-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-wine-900 text-sm">3. Preview ({rows.length} products)</h3>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 wine-gradient-bg text-gold-300 font-bold text-xs rounded uppercase tracking-wider gold-border shadow hover:brightness-110 disabled:opacity-60"
            >
              {isSubmitting ? "Importing..." : "Import All Products"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto border border-stone-200 rounded">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-stone-50 sticky top-0">
                <tr>
                  {previewColumns.map((col) => (
                    <th key={col} className="p-2 font-bold text-stone-600 uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    {previewColumns.map((col) => (
                      <td key={col} className="p-2 text-stone-700 whitespace-nowrap max-w-[200px] truncate">
                        {String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {summary && (
        <div className="p-5 bg-white rounded-xl border border-stone-200 space-y-4">
          <h3 className="font-bold text-wine-900 text-sm">Import Results</h3>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-stone-50 rounded text-center">
              <p className="text-2xl font-bold text-wine-900">{summary.totalRows}</p>
              <p className="text-stone-500 uppercase tracking-wider mt-1">Total Rows</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded text-center">
              <p className="text-2xl font-bold text-emerald-700">{summary.successCount}</p>
              <p className="text-emerald-600 uppercase tracking-wider mt-1">Created</p>
            </div>
            <div className="p-3 bg-red-50 rounded text-center">
              <p className="text-2xl font-bold text-red-700">{summary.failureCount}</p>
              <p className="text-red-600 uppercase tracking-wider mt-1">Failed</p>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-1.5">
            {summary.results.map((r) => (
              <div
                key={r.rowNumber}
                className={`flex items-start gap-2 p-2.5 rounded text-xs ${
                  r.success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
                }`}
              >
                {r.success ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <span>
                  <strong>Row {r.rowNumber}:</strong> {r.success ? `Created "${r.productName}"` : r.error}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => router.push("/admin/products")}
              className="px-5 py-2.5 wine-gradient-bg text-gold-300 font-bold text-xs rounded uppercase tracking-wider gold-border shadow hover:brightness-110"
            >
              Go to Products
            </button>
            <button
              onClick={() => {
                setRows([]);
                setSummary(null);
                setFileName(null);
              }}
              className="px-5 py-2.5 border border-stone-300 text-stone-700 font-bold text-xs rounded uppercase tracking-wider hover:bg-stone-50"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}