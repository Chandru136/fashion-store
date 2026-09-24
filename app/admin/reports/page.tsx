import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "@/lib/session-config";
import { verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import {
  parseDateFilter,
  getReportsOverview,
  getSalesReport,
  getOrderLineItemsReport,
  getGstReport,
  getInventoryReport,
  getPaymentsReport,
  getRefundsReport,
  getCustomersReport,
  getCouponsReport,
  ReportType,
} from "@/lib/services/report.service";
import { ReportsFilterBar } from "@/components/admin/reports/ReportsFilterBar";
import { ReportPagination } from "@/components/admin/reports/ReportPagination";
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Receipt,
  Boxes,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Reports & CSV Export | Sudha Collections Administration",
  description: "Financial analytics, GST compliance, inventory valuation, and CSV export portal for Sudha Collections.",
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const formatCurrency = (amount: number) => currencyFormatter.format(amount);

const formatDate = (d: Date | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

interface ReportsPageProps {
  searchParams: Promise<{
    tab?: string;
    range?: string;
    from?: string;
    to?: string;
    stockFilter?: string;
    page?: string;
    pageSize?: string;
  }>;
}

export default async function AdminReportsPage({ searchParams }: ReportsPageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    redirect("/login?callbackUrl=/admin/reports");
  }

  const actor = await prisma.user.findUnique({
    where: { id: session.id },
    select: { role: true, status: true },
  });

  if (
    !actor ||
    actor.status !== "ACTIVE" ||
    !hasPermission(actor.role, PERMISSIONS.VIEW_REPORTS)
  ) {
    return (
      <div className="p-8 bg-red-50 text-red-800 rounded-xl border border-red-200">
        <h2 className="font-bold text-lg">Access Denied</h2>
        <p className="text-sm mt-1">
          You do not have the required permissions to view or export administrative reports.
        </p>
      </div>
    );
  }

  const sp = await searchParams;
  const currentTab = (sp.tab || "sales") as ReportType;
  const currentRange = sp.range || "30days";
  const from = sp.from;
  const to = sp.to;
  const stockFilter = (sp.stockFilter || "all") as "all" | "low" | "out";
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.pageSize) || 25));
  const paginationOpts = { page, pageSize };

  const filter = parseDateFilter(currentRange, from, to);

  // Fetch overview metrics & tab-specific preview data concurrently
  const [overview, result] = await Promise.all([
    getReportsOverview(filter),
    (async () => {
      switch (currentTab) {
        case "sales":
          return await getSalesReport(filter, paginationOpts);
        case "items":
          return await getOrderLineItemsReport(filter, paginationOpts);
        case "gst":
          return await getGstReport(filter, paginationOpts);
        case "inventory":
          return await getInventoryReport(stockFilter, paginationOpts);
        case "payments":
          return await getPaymentsReport(filter, paginationOpts);
        case "refunds":
          return await getRefundsReport(filter, paginationOpts);
        case "customers":
          return await getCustomersReport(paginationOpts);
        case "coupons":
          return await getCouponsReport(paginationOpts);
        default:
          return await getSalesReport(filter, paginationOpts);
      }
    })(),
  ]);

  const { data: tabData, pagination } = result;

  const quickExportUrl = (reportType: string) =>
    `/api/admin/reports/export?report=${reportType}&range=${currentRange}${
      currentRange === "custom" && from ? `&from=${from}` : ""
    }${currentRange === "custom" && to ? `&to=${to}` : ""}`;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="font-serif text-3xl font-bold text-wine-900">
            Reports &amp; Data Export Hub
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Generate analytical ledgers, GST tax breakdowns, inventory stock valuations, and patron metrics for Sudha Collections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-stone-600 bg-ivory-50 border border-stone-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-gold-600" />
            <span>Active Window: <strong>{filter.label}</strong></span>
          </span>
        </div>
      </div>

      {/* KPI Metric Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Net Revenue
            </span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-serif text-2xl font-bold text-emerald-950">
            {formatCurrency(overview.netRevenue)}
          </p>
          <p className="text-[10px] text-emerald-700">
            Gross: {formatCurrency(overview.grossSales)} (After ₹{overview.refundedRupees.toLocaleString("en-IN")} refunds)
          </p>
        </div>

        <div className="p-4 rounded-xl border border-gold-300 bg-ivory-50 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-wine-900">
              Orders Placed
            </span>
            <ShoppingBag className="w-4 h-4 text-gold-600" />
          </div>
          <p className="font-serif text-2xl font-bold text-wine-900">
            {overview.totalOrders.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-stone-500">
            {overview.deliveredOrders} Delivered · {overview.cancelledOrders} Cancelled/Returned
          </p>
        </div>

        <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
              Average Order Value
            </span>
            <TrendingUp className="w-4 h-4 text-stone-500" />
          </div>
          <p className="font-serif text-2xl font-bold text-wine-900">
            {formatCurrency(overview.averageOrderValue)}
          </p>
          <p className="text-[10px] text-stone-500">
            Avg basket spend across verified orders
          </p>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
              Inventory Alerts
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="font-serif text-2xl font-bold text-amber-950">
            {overview.lowStockCount + overview.outOfStockCount} SKUs
          </p>
          <p className="text-[10px] text-amber-800">
            {overview.lowStockCount} Low stock (≤ 5) · {overview.outOfStockCount} Out of stock
          </p>
        </div>
      </div>

      {/* Quick 1-Click CSV Download Shortcuts */}
      <div className="p-5 bg-gradient-to-r from-stone-50 to-ivory-50 rounded-xl border border-stone-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-wine-900" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-wine-900">
              Instant Business CSV Downloads ({filter.label})
            </h2>
          </div>
          <span className="text-[11px] text-stone-500">UTF-8 Excel-Ready</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <a
            href={quickExportUrl("sales")}
            download
            className="flex items-center justify-between p-3 rounded-lg border border-stone-200 bg-white hover:border-gold-500 hover:shadow-sm transition-all group"
          >
            <div>
              <p className="text-xs font-bold text-stone-800 group-hover:text-wine-900">Sales Ledger</p>
              <p className="text-[10px] text-stone-500">Orders, revenue &amp; discounts</p>
            </div>
            <Download className="w-4 h-4 text-stone-400 group-hover:text-gold-600" />
          </a>

          <a
            href={quickExportUrl("gst")}
            download
            className="flex items-center justify-between p-3 rounded-lg border border-stone-200 bg-white hover:border-gold-500 hover:shadow-sm transition-all group"
          >
            <div>
              <p className="text-xs font-bold text-stone-800 group-hover:text-wine-900">GST Compliance</p>
              <p className="text-[10px] text-stone-500">State-wise CGST/SGST/IGST</p>
            </div>
            <Receipt className="w-4 h-4 text-stone-400 group-hover:text-gold-600" />
          </a>

          <a
            href="/api/admin/reports/export?report=inventory&stockFilter=all"
            download
            className="flex items-center justify-between p-3 rounded-lg border border-stone-200 bg-white hover:border-gold-500 hover:shadow-sm transition-all group"
          >
            <div>
              <p className="text-xs font-bold text-stone-800 group-hover:text-wine-900">Inventory Valuation</p>
              <p className="text-[10px] text-stone-500">Active stock &amp; tied capital</p>
            </div>
            <Boxes className="w-4 h-4 text-stone-400 group-hover:text-gold-600" />
          </a>

          <a
            href="/api/admin/reports/export?report=customers"
            download
            className="flex items-center justify-between p-3 rounded-lg border border-stone-200 bg-white hover:border-gold-500 hover:shadow-sm transition-all group"
          >
            <div>
              <p className="text-xs font-bold text-stone-800 group-hover:text-wine-900">Patron CLV &amp; VIPs</p>
              <p className="text-[10px] text-stone-500">Lifetime buyer history</p>
            </div>
            <Users className="w-4 h-4 text-stone-400 group-hover:text-gold-600" />
          </a>
        </div>
      </div>

      {/* Interactive Tabs and Filters Component */}
      <ReportsFilterBar
        currentTab={currentTab}
        currentRange={currentRange}
        from={from}
        to={to}
        rangeLabel={filter.label}
        stockFilter={stockFilter}
      />

      {/* Tab Preview Ledger Section */}
      <div className="bg-ivory-50 rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-lg font-bold text-wine-900">
              {currentTab === "sales" && "Sales Ledger Preview"}
              {currentTab === "items" && "Order Line Items Breakdown"}
              {currentTab === "gst" && "GST & Tax Filing Breakdown"}
              {currentTab === "inventory" && "Warehouse Inventory & Valuation"}
              {currentTab === "payments" && "Payment Gateway Settlements"}
              {currentTab === "refunds" && "Customer Refunds & Returns Audit"}
              {currentTab === "customers" && "Patron Lifetime Spend & Loyalty"}
              {currentTab === "coupons" && "Coupon Code Performance"}
            </h3>
            <p className="text-[11px] text-stone-500">
              Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} records matching {filter.label}). Click &quot;Download Full CSV&quot; for the complete unpaginated dataset.
            </p>
          </div>

          <a
            href={quickExportUrl(currentTab)}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 wine-gradient-bg text-gold-300 text-xs font-bold rounded gold-border shadow-sm hover:brightness-110"
          >
            <Download className="w-3.5 h-3.5" /> Download Full CSV
          </a>
        </div>

        {/* Dynamic Table Rendering */}
        <div className="overflow-x-auto">
          {currentTab === "sales" && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider">
                  <th className="p-3">Order #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Subtotal</th>
                  <th className="p-3">Discount</th>
                  <th className="p-3">Total Payable</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {Array.isArray(tabData) && tabData.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (tabData as any[]).map((row, i) => (
                    <tr key={i} className="hover:bg-stone-50/70 transition-colors">
                      <td className="p-3 font-mono font-bold text-wine-900">{row.orderNumber}</td>
                      <td className="p-3 text-stone-600">{formatDate(row.date)}</td>
                      <td className="p-3">
                        <p className="font-semibold text-stone-800">{row.customerName}</p>
                        <p className="text-[10px] text-stone-500">{row.shippingCity}, {row.shippingState}</p>
                      </td>
                      <td className="p-3 text-stone-600">{row.itemsCount} pcs</td>
                      <td className="p-3 font-mono">{formatCurrency(row.subtotal)}</td>
                      <td className="p-3 text-red-700 font-mono">
                        {row.discount > 0 ? `-${formatCurrency(row.discount)}` : "—"}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-800">
                        {formatCurrency(row.total)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : row.paymentStatus === "REFUNDED"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {row.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.orderStatus === "DELIVERED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : row.orderStatus === "CANCELLED"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-stone-100 text-stone-700 border border-stone-200"
                          }`}
                        >
                          {row.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-stone-500">
                      No sales records found for {filter.label}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {currentTab === "items" && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider">
                  <th className="p-3">Order #</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Item Details</th>
                  <th className="p-3">Variant</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Unit Price</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {Array.isArray(tabData) && tabData.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (tabData as any[]).map((row, i) => (
                    <tr key={i} className="hover:bg-stone-50/70 transition-colors">
                      <td className="p-3 font-mono font-bold text-wine-900">{row.orderNumber}</td>
                      <td className="p-3 font-mono text-stone-600">{row.sku}</td>
                      <td className="p-3">
                        <p className="font-semibold text-stone-800">{row.productName}</p>
                        <p className="text-[10px] text-stone-500">{row.category} · {row.fabric || "Silk"}</p>
                      </td>
                      <td className="p-3 text-stone-600">
                        {row.color} / {row.size}
                      </td>
                      <td className="p-3 font-semibold text-stone-800">{row.quantity}</td>
                      <td className="p-3 font-mono">{formatCurrency(row.unitPrice)}</td>
                      <td className="p-3 font-mono font-bold text-wine-900">
                        {formatCurrency(row.totalPrice)}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                          {row.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-stone-500">
                      No order line items found for {filter.label}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {currentTab === "gst" && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider">
                  <th className="p-3">Invoice / Order #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Place of Supply (State)</th>
                  <th className="p-3">Taxable Value</th>
                  <th className="p-3">GST Rate</th>
                  <th className="p-3">CGST</th>
                  <th className="p-3">SGST</th>
                  <th className="p-3">IGST</th>
                  <th className="p-3">Total GST</th>
                  <th className="p-3">Total Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {Array.isArray(tabData) && tabData.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (tabData as any[]).map((row, i) => (
                    <tr key={i} className="hover:bg-stone-50/70 transition-colors">
                      <td className="p-3 font-mono font-bold text-wine-900">{row.orderNumber}</td>
                      <td className="p-3 text-stone-600">{formatDate(row.orderDate)}</td>
                      <td className="p-3 font-semibold text-stone-800">
                        {row.shippingState || "Karnataka"} ({row.shippingPincode || "—"})
                      </td>
                      <td className="p-3 font-mono">{formatCurrency(row.taxableAmount)}</td>
                      <td className="p-3 font-semibold text-stone-600">{row.gstRate}</td>
                      <td className="p-3 font-mono text-stone-600">{formatCurrency(row.cgst)}</td>
                      <td className="p-3 font-mono text-stone-600">{formatCurrency(row.sgst)}</td>
                      <td className="p-3 font-mono text-stone-600">{formatCurrency(row.igst)}</td>
                      <td className="p-3 font-mono font-bold text-wine-900">{formatCurrency(row.totalGst)}</td>
                      <td className="p-3 font-mono font-bold text-emerald-800">{formatCurrency(row.totalInvoiceAmount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-stone-500">
                      No GST records found for {filter.label}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {currentTab === "inventory" && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider">
                  <th className="p-3">SKU</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Variant</th>
                  <th className="p-3">Selling Price</th>
                  <th className="p-3">Available</th>
                  <th className="p-3">Reserved</th>
                  <th className="p-3">Stock Valuation</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {Array.isArray(tabData) && tabData.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (tabData as any[]).map((row, i) => (
                    <tr key={i} className="hover:bg-stone-50/70 transition-colors">
                      <td className="p-3 font-mono font-bold text-wine-900">{row.sku}</td>
                      <td className="p-3">
                        <p className="font-semibold text-stone-800">{row.productName}</p>
                        <p className="text-[10px] text-stone-500">{row.category} · {row.brand}</p>
                      </td>
                      <td className="p-3 text-stone-600">{row.color} / {row.size}</td>
                      <td className="p-3 font-mono">{formatCurrency(row.sellingPrice)}</td>
                      <td className="p-3 font-semibold text-stone-900">{row.availableStock}</td>
                      <td className="p-3 text-stone-500">{row.reservedStock}</td>
                      <td className="p-3 font-mono font-bold text-wine-900">
                        {formatCurrency(row.stockValuation)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.availableStock <= 0
                              ? "bg-red-100 text-red-800"
                              : row.availableStock <= row.lowStockThreshold
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {row.stockStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-stone-500">
                      No inventory records matching current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {currentTab === "payments" && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider">
                  <th className="p-3">Transaction ID</th>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Paid Date</th>
                  <th className="p-3">Refund Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {Array.isArray(tabData) && tabData.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (tabData as any[]).map((row, i) => (
                    <tr key={i} className="hover:bg-stone-50/70 transition-colors">
                      <td className="p-3 font-mono text-stone-600">{row.transactionId}</td>
                      <td className="p-3 font-mono font-bold text-wine-900">{row.orderNumber}</td>
                      <td className="p-3 font-semibold text-stone-800">{row.customerName}</td>
                      <td className="p-3 font-mono text-stone-600 uppercase">{row.provider}</td>
                      <td className="p-3 font-mono font-bold text-emerald-800">{formatCurrency(row.amount)}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-stone-100 text-stone-700"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3 text-stone-600">{formatDate(row.paidAt)}</td>
                      <td className="p-3 text-stone-600">
                        {row.hasRefund ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                            {row.refundStatus}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-stone-500">
                      No payment settlements recorded in {filter.label}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {currentTab === "refunds" && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider">
                  <th className="p-3">Refund ID</th>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {Array.isArray(tabData) && tabData.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (tabData as any[]).map((row, i) => (
                    <tr key={i} className="hover:bg-stone-50/70 transition-colors">
                      <td className="p-3 font-mono text-stone-600">{row.refundId.slice(0, 12)}…</td>
                      <td className="p-3 font-mono font-bold text-wine-900">{row.orderNumber}</td>
                      <td className="p-3 font-semibold text-stone-800">{row.customerName}</td>
                      <td className="p-3 font-mono font-bold text-purple-900">{formatCurrency(row.amount)}</td>
                      <td className="p-3 text-stone-600 max-w-xs truncate">{row.reason}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3 text-stone-600">{formatDate(row.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-500">
                      No refund requests recorded in {filter.label}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {currentTab === "customers" && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider">
                  <th className="p-3">Patron Name</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Orders Completed</th>
                  <th className="p-3">Lifetime Spend</th>
                  <th className="p-3">AOV</th>
                  <th className="p-3">Last Purchase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {Array.isArray(tabData) && tabData.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (tabData as any[]).map((row, i) => (
                    <tr key={i} className="hover:bg-stone-50/70 transition-colors">
                      <td className="p-3">
                        <p className="font-bold text-stone-900">{row.name}</p>
                        <p className="text-[10px] text-stone-500">Member since {formatDate(row.registeredAt)}</p>
                      </td>
                      <td className="p-3 text-stone-600">
                        <p>{row.email}</p>
                        <p className="text-[10px] text-stone-500">{row.phone}</p>
                      </td>
                      <td className="p-3 text-stone-600">
                        {row.city !== "—" ? `${row.city}, ${row.state}` : "—"}
                      </td>
                      <td className="p-3 font-semibold text-stone-800">{row.totalOrdersPlaced} orders</td>
                      <td className="p-3 font-mono font-bold text-wine-900">
                        {formatCurrency(row.totalSpent)}
                      </td>
                      <td className="p-3 font-mono text-stone-600">
                        {formatCurrency(row.averageOrderValue)}
                      </td>
                      <td className="p-3 text-stone-600">{formatDate(row.lastOrderDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-500">
                      No customer purchasing records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {currentTab === "coupons" && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider">
                  <th className="p-3">Coupon Code</th>
                  <th className="p-3">Benefit</th>
                  <th className="p-3">Usage / Limit</th>
                  <th className="p-3">Sales Driven</th>
                  <th className="p-3">Total Subsidized</th>
                  <th className="p-3">Validity</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {Array.isArray(tabData) && tabData.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (tabData as any[]).map((row, i) => (
                    <tr key={i} className="hover:bg-stone-50/70 transition-colors">
                      <td className="p-3 font-mono font-bold text-wine-900">{row.code}</td>
                      <td className="p-3 text-stone-700">
                        {row.discountType === "PERCENTAGE"
                          ? `${row.discountValue}% OFF`
                          : `₹${row.discountValue} FLAT`}
                      </td>
                      <td className="p-3 text-stone-600">
                        {row.usedCount} / {row.usageLimit}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-800">
                        {formatCurrency(row.revenueGenerated)}
                      </td>
                      <td className="p-3 font-mono text-red-700">
                        {formatCurrency(row.totalDiscountGranted)}
                      </td>
                      <td className="p-3 text-stone-500">
                        Till {formatDate(row.endDate)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-500">
                      No coupon campaigns found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Custom Pagination Component */}
        <ReportPagination pagination={pagination} />
      </div>
    </div>
  );
}
