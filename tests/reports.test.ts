import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseDateFilter,
  escapeCsvCell,
  buildCsvString,
  getSalesReport,
  getInventoryReport,
} from "../lib/services/report.service";

test("parseDateFilter computes correct date ranges for presets", () => {
  const allTime = parseDateFilter("all");
  assert.equal(allTime.label, "All Time");
  assert.equal(allTime.start, undefined);
  assert.equal(allTime.end, undefined);

  const today = parseDateFilter("today");
  assert.equal(today.label, "Today");
  assert.ok(today.start instanceof Date);
  assert.ok(today.end instanceof Date);
  assert.equal(today.start?.getHours(), 0);
  assert.equal(today.end?.getHours(), 23);

  const sevenDays = parseDateFilter("7days");
  assert.equal(sevenDays.label, "Last 7 Days");
  assert.ok(sevenDays.start instanceof Date);
  assert.ok(sevenDays.end instanceof Date);
  assert.ok(sevenDays.end.getTime() > sevenDays.start.getTime());

  const ninetyDays = parseDateFilter("90days");
  assert.equal(ninetyDays.label, "Last 90 Days");
  assert.ok(ninetyDays.start instanceof Date);
  assert.ok(ninetyDays.end instanceof Date);

  const fy = parseDateFilter("fy");
  assert.ok(fy.label.startsWith("FY "));
  assert.ok(fy.start instanceof Date);
  assert.equal(fy.start?.getMonth(), 3); // April is month index 3
  assert.equal(fy.start?.getDate(), 1);

  const custom = parseDateFilter("custom", "2026-01-01", "2026-01-31");
  assert.equal(custom.label, "2026-01-01 to 2026-01-31");
  assert.ok(custom.start instanceof Date);
  assert.ok(custom.end instanceof Date);
  assert.equal(custom.start?.getFullYear(), 2026);
  assert.equal(custom.start?.getMonth(), 0);
  assert.equal(custom.start?.getDate(), 1);
  assert.equal(custom.end?.getFullYear(), 2026);
  assert.equal(custom.end?.getMonth(), 0);
  assert.equal(custom.end?.getDate(), 31);
});

test("escapeCsvCell properly quotes cells containing commas, quotes, and newlines", () => {
  assert.equal(escapeCsvCell("Standard"), "Standard");
  assert.equal(escapeCsvCell("Soft Silk, Kanchipuram"), '"Soft Silk, Kanchipuram"');
  assert.equal(escapeCsvCell('Saree "Special"'), '"Saree ""Special"""');
  assert.equal(escapeCsvCell("Line1\nLine2"), '"Line1\nLine2"');
  assert.equal(escapeCsvCell(null), "");
  assert.equal(escapeCsvCell(undefined), "");
  assert.equal(escapeCsvCell(12500.5), "12500.5");
});

test("buildCsvString includes UTF-8 BOM and correct newline delimiters", () => {
  const headers = ["Order Number", "Product Name", "Total (INR)"];
  const rows = [
    ["SC-ORD-1001", "Kanchipuram Pure Silk Saree", 15499],
    ["SC-ORD-1002", "Banarasi Brocade, Golden Zari", 22000],
  ];

  const csv = buildCsvString(headers, rows);
  // Verify UTF-8 BOM (\uFEFF)
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes("Order Number,Product Name,Total (INR)"));
  assert.ok(csv.includes("SC-ORD-1001,Kanchipuram Pure Silk Saree,15499"));
  assert.ok(csv.includes('SC-ORD-1002,"Banarasi Brocade, Golden Zari",22000'));
});

test("custom pagination slices records and populates metadata correctly", async () => {
  const filter = parseDateFilter("all");
  const result = await getSalesReport(filter, { page: 1, pageSize: 5 });

  assert.ok(Array.isArray(result.data));
  assert.ok(result.data.length <= 5);
  assert.equal(result.pagination.currentPage, 1);
  assert.equal(result.pagination.pageSize, 5);
  assert.ok(result.pagination.totalCount >= 0);
  assert.ok(result.pagination.totalPages >= 1);

  const invResult = await getInventoryReport("all", { page: 2, pageSize: 10 });
  assert.ok(Array.isArray(invResult.data));
  assert.equal(invResult.pagination.currentPage, 2);
  assert.equal(invResult.pagination.pageSize, 10);
});
