import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/session-config";
import { verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import {
  parseDateFilter,
  buildCsvString,
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

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
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
      return NextResponse.json(
        { error: "Forbidden. Insufficient permissions to export reports." },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const report = (searchParams.get("report") || "sales") as ReportType;
    const range = searchParams.get("range") || "30days";
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const stockFilter = (searchParams.get("stockFilter") || "all") as "all" | "low" | "out";

    const filter = parseDateFilter(range, from, to);
    const dateStamp = new Date().toISOString().slice(0, 10);

    let filename = `sudha-collections-${report}-report-${dateStamp}.csv`;
    let headers: string[] = [];
    let rows: (string | number | boolean | Date | null | undefined)[][] = [];

    switch (report) {
      case "sales": {
        const { data } = await getSalesReport(filter);
        filename = `sudha-collections-sales-ledger-${dateStamp}.csv`;
        headers = [
          "Order Number",
          "Order Date",
          "Customer Name",
          "Customer Email",
          "Customer Phone",
          "Items Count",
          "Subtotal (INR)",
          "Discount (INR)",
          "Coupon Code",
          "Shipping (INR)",
          "Tax (INR)",
          "Total Payable (INR)",
          "Payment Status",
          "Order Status",
          "Shipping City",
          "Shipping State",
          "Shipping Pincode",
        ];
        rows = data.map((d) => [
          d.orderNumber,
          d.date,
          d.customerName,
          d.customerEmail,
          d.customerPhone,
          d.itemsCount,
          d.subtotal.toFixed(2),
          d.discount.toFixed(2),
          d.couponCode,
          d.shipping.toFixed(2),
          d.tax.toFixed(2),
          d.total.toFixed(2),
          d.paymentStatus,
          d.orderStatus,
          d.shippingCity,
          d.shippingState,
          d.shippingPincode,
        ]);
        break;
      }

      case "items": {
        const { data } = await getOrderLineItemsReport(filter);
        filename = `sudha-collections-order-items-${dateStamp}.csv`;
        headers = [
          "Order Number",
          "Order Date",
          "SKU",
          "Product Name",
          "Category",
          "Brand",
          "Color",
          "Size",
          "Fabric",
          "Quantity",
          "Unit Price (INR)",
          "Total Price (INR)",
          "Order Status",
          "Payment Status",
          "Customer Name",
          "Shipping State",
        ];
        rows = data.map((d) => [
          d.orderNumber,
          d.orderDate,
          d.sku,
          d.productName,
          d.category,
          d.brand,
          d.color,
          d.size,
          d.fabric,
          d.quantity,
          d.unitPrice.toFixed(2),
          d.totalPrice.toFixed(2),
          d.orderStatus,
          d.paymentStatus,
          d.customerName,
          d.shippingState,
        ]);
        break;
      }

      case "gst": {
        const { data } = await getGstReport(filter);
        filename = `sudha-collections-gst-compliance-${dateStamp}.csv`;
        headers = [
          "Order / Invoice #",
          "Invoice Date",
          "Customer Name",
          "Place of Supply (State)",
          "Shipping Pincode",
          "Taxable Amount (INR)",
          "GST Rate",
          "CGST (INR)",
          "SGST (INR)",
          "IGST (INR)",
          "Total Tax (INR)",
          "Invoice Total (INR)",
        ];
        rows = data.map((d) => [
          d.orderNumber,
          d.orderDate,
          d.customerName,
          d.shippingState,
          d.shippingPincode,
          d.taxableAmount.toFixed(2),
          d.gstRate,
          d.cgst.toFixed(2),
          d.sgst.toFixed(2),
          d.igst.toFixed(2),
          d.totalGst.toFixed(2),
          d.totalInvoiceAmount.toFixed(2),
        ]);
        break;
      }

      case "inventory":
      case "low_stock": {
        const effectiveStockFilter = report === "low_stock" ? "low" : stockFilter;
        const { data } = await getInventoryReport(effectiveStockFilter);
        filename = `sudha-collections-inventory-${effectiveStockFilter}-${dateStamp}.csv`;
        headers = [
          "SKU",
          "Product Name",
          "Category",
          "Brand",
          "Color",
          "Size",
          "MRP (INR)",
          "Selling Price (INR)",
          "Available Stock",
          "Reserved Stock",
          "Total Stock",
          "Stock Valuation (INR)",
          "Low Stock Threshold",
          "Stock Status",
          "Last Updated",
        ];
        rows = data.map((d) => [
          d.sku,
          d.productName,
          d.category,
          d.brand,
          d.color,
          d.size,
          d.mrp.toFixed(2),
          d.sellingPrice.toFixed(2),
          d.availableStock,
          d.reservedStock,
          d.totalStock,
          d.stockValuation.toFixed(2),
          d.lowStockThreshold,
          d.stockStatus,
          d.lastUpdated,
        ]);
        break;
      }

      case "payments": {
        const { data } = await getPaymentsReport(filter);
        filename = `sudha-collections-payments-reconciliation-${dateStamp}.csv`;
        headers = [
          "Payment ID",
          "Order Number",
          "Customer Name",
          "Provider",
          "Transaction ID",
          "Gateway Order ID",
          "Amount (INR)",
          "Currency",
          "Status",
          "Paid At",
          "Refunded Amount (INR)",
          "Has Refund",
          "Refund Status",
          "Created Date",
          "Error Details",
        ];
        rows = data.map((d) => [
          d.paymentId,
          d.orderNumber,
          d.customerName,
          d.provider,
          d.transactionId,
          d.gatewayOrderId,
          d.amount.toFixed(2),
          d.currency,
          d.status,
          d.paidAt,
          d.refundedAmount.toFixed(2),
          d.hasRefund ? "YES" : "NO",
          d.refundStatus,
          d.createdAt,
          d.lastError,
        ]);
        break;
      }

      case "refunds": {
        const { data } = await getRefundsReport(filter);
        filename = `sudha-collections-refunds-audit-${dateStamp}.csv`;
        headers = [
          "Refund ID",
          "Order Number",
          "Customer Name",
          "Transaction ID",
          "Gateway Refund ID",
          "Amount (INR)",
          "Reason",
          "Status",
          "Attempts",
          "Created At",
          "Last Error",
        ];
        rows = data.map((d) => [
          d.refundId,
          d.orderNumber,
          d.customerName,
          d.transactionId,
          d.gatewayRefundId,
          d.amount.toFixed(2),
          d.reason,
          d.status,
          d.attempts,
          d.createdAt,
          d.lastError,
        ]);
        break;
      }

      case "customers": {
        const { data } = await getCustomersReport();
        filename = `sudha-collections-patron-clv-${dateStamp}.csv`;
        headers = [
          "Customer ID",
          "Patron Name",
          "Email",
          "Phone",
          "City",
          "State",
          "Registered Date",
          "Account Status",
          "Total Orders Completed",
          "Lifetime Spend (INR)",
          "Average Order Value (INR)",
          "Last Order Date",
        ];
        rows = data.map((d) => [
          d.customerId,
          d.name,
          d.email,
          d.phone,
          d.city,
          d.state,
          d.registeredAt,
          d.status,
          d.totalOrdersPlaced,
          d.totalSpent.toFixed(2),
          d.averageOrderValue.toFixed(2),
          d.lastOrderDate,
        ]);
        break;
      }

      case "coupons": {
        const { data } = await getCouponsReport();
        filename = `sudha-collections-coupons-performance-${dateStamp}.csv`;
        headers = [
          "Coupon Code",
          "Discount Type",
          "Discount Value",
          "Minimum Order Amount (INR)",
          "Max Discount",
          "Usage Limit",
          "Used Count",
          "Total Revenue Generated (INR)",
          "Total Discount Granted (INR)",
          "Valid From",
          "Valid Till",
          "Status",
        ];
        rows = data.map((d) => [
          d.code,
          d.discountType,
          d.discountValue,
          d.minimumOrderAmount.toFixed(2),
          d.maximumDiscount,
          d.usageLimit,
          d.usedCount,
          d.revenueGenerated.toFixed(2),
          d.totalDiscountGranted.toFixed(2),
          d.startDate,
          d.endDate,
          d.status,
        ]);
        break;
      }

      default: {
        return NextResponse.json({ error: `Unsupported report type: ${report}` }, { status: 400 });
      }
    }

    const csvContent = buildCsvString(headers, rows);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Report CSV Export Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while generating the CSV report." },
      { status: 500 }
    );
  }
}
