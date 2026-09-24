import { prisma } from "@/lib/db";
import { placedOrderWhere } from "@/lib/services/order.service";
import type { Prisma } from "@prisma/client";

export type ReportType =
  | "sales"
  | "items"
  | "gst"
  | "inventory"
  | "low_stock"
  | "payments"
  | "refunds"
  | "customers"
  | "coupons";

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "7days"
  | "30days"
  | "this_month"
  | "last_month"
  | "90days"
  | "fy"
  | "all"
  | "custom";

export interface DateFilter {
  start?: Date;
  end?: Date;
  label: string;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

export interface PaginationMeta {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedReport<T> {
  data: T[];
  pagination: PaginationMeta;
}

export function parseDateFilter(
  range: string = "30days",
  customFrom?: string,
  customTo?: string
): DateFilter {
  const now = new Date();
  const startOfDay = (d: Date) => {
    const res = new Date(d);
    res.setHours(0, 0, 0, 0);
    return res;
  };
  const endOfDay = (d: Date) => {
    const res = new Date(d);
    res.setHours(23, 59, 59, 999);
    return res;
  };

  switch (range) {
    case "today": {
      const today = startOfDay(now);
      return { start: today, end: endOfDay(now), label: "Today" };
    }
    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        start: startOfDay(yesterday),
        end: endOfDay(yesterday),
        label: "Yesterday",
      };
    }
    case "7days": {
      const past = new Date(now);
      past.setDate(past.getDate() - 7);
      return { start: startOfDay(past), end: endOfDay(now), label: "Last 7 Days" };
    }
    case "30days": {
      const past = new Date(now);
      past.setDate(past.getDate() - 30);
      return { start: startOfDay(past), end: endOfDay(now), label: "Last 30 Days" };
    }
    case "90days": {
      const past = new Date(now);
      past.setDate(past.getDate() - 90);
      return { start: startOfDay(past), end: endOfDay(now), label: "Last 90 Days" };
    }
    case "this_month": {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfDay(firstDay), end: endOfDay(now), label: "This Month" };
    }
    case "last_month": {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        start: startOfDay(firstDay),
        end: endOfDay(lastDay),
        label: "Last Month",
      };
    }
    case "fy": {
      const currentYear = now.getFullYear();
      const fyStartYear = now.getMonth() >= 3 ? currentYear : currentYear - 1;
      const fyStart = new Date(fyStartYear, 3, 1);
      const fyEnd = new Date(fyStartYear + 1, 2, 31);
      return {
        start: startOfDay(fyStart),
        end: endOfDay(now < fyEnd ? now : fyEnd),
        label: `FY ${fyStartYear}-${String(fyStartYear + 1).slice(2)}`,
      };
    }
    case "custom": {
      const start = customFrom
        ? customFrom.includes("T")
          ? startOfDay(new Date(customFrom))
          : startOfDay(new Date(`${customFrom}T00:00:00`))
        : undefined;
      const end = customTo
        ? customTo.includes("T")
          ? endOfDay(new Date(customTo))
          : endOfDay(new Date(`${customTo}T23:59:59.999`))
        : undefined;
      const label =
        customFrom && customTo
          ? `${customFrom} to ${customTo}`
          : customFrom
            ? `From ${customFrom}`
            : customTo
              ? `Until ${customTo}`
              : "Custom Range";
      return { start, end, label };
    }
    case "all":
    default:
      return { label: "All Time" };
  }
}

export function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (val instanceof Date) {
    return `"${val.toISOString().replace("T", " ").slice(0, 19)}"`;
  }
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsvString(
  headers: string[],
  rows: (string | number | boolean | Date | null | undefined)[][]
): string {
  const headerRow = headers.map(escapeCsvCell).join(",");
  const dataRows = rows.map((row) => row.map(escapeCsvCell).join(","));
  // \uFEFF is UTF-8 Byte Order Mark for Excel compatibility
  return "\uFEFF" + [headerRow, ...dataRows].join("\r\n");
}

/**
 * Fetch executive overview KPIs for the specified date range.
 */
export async function getReportsOverview(filter: DateFilter) {
  const createdAtWhere: Prisma.DateTimeFilter | undefined =
    filter.start || filter.end
      ? {
        ...(filter.start ? { gte: filter.start } : {}),
        ...(filter.end ? { lte: filter.end } : {}),
      }
      : undefined;

  const orderWhere: Prisma.OrderWhereInput = {
    AND: [
      placedOrderWhere,
      ...(createdAtWhere ? [{ createdAt: createdAtWhere }] : []),
    ],
  };

  const [
    salesAgg,
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    activeProductsCount,
    lowStockCount,
    outOfStockCount,
    totalPatronsCount,
    refundsAgg,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: {
        ...orderWhere,
        paymentStatus: { in: ["PAID", "REFUNDED"] },
      },
      _sum: {
        total: true,
        discount: true,
        tax: true,
        shipping: true,
      },
      _avg: {
        total: true,
      },
    }),
    prisma.order.count({ where: orderWhere }),
    prisma.order.count({ where: { ...orderWhere, status: "DELIVERED" } }),
    prisma.order.count({
      where: { ...orderWhere, status: { in: ["CANCELLED", "RETURNED"] } },
    }),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.inventory.count({
      where: { availableStock: { gt: 0, lte: 5 } },
    }),
    prisma.inventory.count({
      where: { availableStock: { lte: 0 } },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.paymentRefund.aggregate({
      where: {
        status: "PROCESSED",
        ...(createdAtWhere ? { createdAt: createdAtWhere } : {}),
      },
      _sum: {
        amountPaise: true,
      },
      _count: true,
    }),
  ]);

  const grossSales = salesAgg._sum.total || 0;
  const totalDiscount = salesAgg._sum.discount || 0;
  const totalTax = salesAgg._sum.tax || 0;
  const totalShipping = salesAgg._sum.shipping || 0;
  const averageOrderValue = salesAgg._avg.total || 0;
  const refundedRupees = (refundsAgg._sum.amountPaise || 0) / 100;
  const netRevenue = grossSales - refundedRupees;

  return {
    grossSales,
    totalDiscount,
    totalTax,
    totalShipping,
    averageOrderValue,
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    refundedRupees,
    refundsCount: refundsAgg._count || 0,
    netRevenue,
    activeProductsCount,
    lowStockCount,
    outOfStockCount,
    totalPatronsCount,
  };
}

/**
 * 1. Sales Ledger Report with Custom Pagination
 */
export async function getSalesReport(filter: DateFilter, pagination?: PaginationOptions) {
  const createdAtWhere =
    filter.start || filter.end
      ? {
        ...(filter.start ? { gte: filter.start } : {}),
        ...(filter.end ? { lte: filter.end } : {}),
      }
      : undefined;

  const whereClause: Prisma.OrderWhereInput = {
    AND: [
      placedOrderWhere,
      ...(createdAtWhere ? [{ createdAt: createdAtWhere }] : []),
    ],
  };

  const totalCount = await prisma.order.count({ where: whereClause });
  const currentPage = Math.max(1, pagination?.page || 1);
  const pageSize = pagination ? Math.min(100, Math.max(1, pagination.pageSize || 25)) : Math.max(1, totalCount);
  const skip = pagination ? (currentPage - 1) * pageSize : 0;
  const take = pagination ? pageSize : undefined;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: { select: { quantity: true } },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  const data = orders.map((o) => ({
    orderNumber: o.orderNumber,
    date: o.createdAt,
    customerName: o.shippingName || o.user?.name || "Customer",
    customerEmail: o.user?.email || "—",
    customerPhone: o.shippingPhone || o.user?.phone || "—",
    itemsCount: o.items.reduce((acc, i) => acc + i.quantity, 0),
    subtotal: o.subtotal,
    discount: o.discount,
    couponCode: o.couponCode || "None",
    shipping: o.shipping,
    tax: o.tax,
    total: o.total,
    paymentStatus: o.paymentStatus,
    orderStatus: o.status,
    shippingCity: o.shippingCity,
    shippingState: o.shippingState,
    shippingPincode: o.shippingPincode,
  }));

  return {
    data,
    pagination: {
      totalCount,
      totalPages,
      currentPage,
      pageSize,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    },
  };
}

/**
 * 2. Order Line Items Report with Custom Pagination
 */
export async function getOrderLineItemsReport(filter: DateFilter, pagination?: PaginationOptions) {
  const createdAtWhere =
    filter.start || filter.end
      ? {
        ...(filter.start ? { gte: filter.start } : {}),
        ...(filter.end ? { lte: filter.end } : {}),
      }
      : undefined;

  const whereClause: Prisma.OrderItemWhereInput = {
    order: {
      AND: [
        placedOrderWhere,
        ...(createdAtWhere ? [{ createdAt: createdAtWhere }] : []),
      ],
    },
  };

  const totalCount = await prisma.orderItem.count({ where: whereClause });
  const currentPage = Math.max(1, pagination?.page || 1);
  const pageSize = pagination ? Math.min(100, Math.max(1, pagination.pageSize || 25)) : Math.max(1, totalCount);
  const skip = pagination ? (currentPage - 1) * pageSize : 0;
  const take = pagination ? pageSize : undefined;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const items = await prisma.orderItem.findMany({
    where: whereClause,
    include: {
      order: {
        select: {
          orderNumber: true,
          createdAt: true,
          status: true,
          paymentStatus: true,
          shippingName: true,
          shippingCity: true,
          shippingState: true,
        },
      },
      product: {
        select: {
          name: true,
          fabric: true,
          category: { select: { name: true } },
          brand: { select: { name: true } },
        },
      },
      variant: {
        select: {
          sku: true,
          color: true,
          size: true,
        },
      },
    },
    orderBy: { order: { createdAt: "desc" } },
    skip,
    take,
  });

  const data = items.map((i) => ({
    orderNumber: i.order.orderNumber,
    orderDate: i.order.createdAt,
    sku: i.sku || i.variant?.sku || "SC-SKU-VAR",
    productName: i.productName || i.product?.name || "Silk Apparel",
    category: i.product?.category?.name || "General",
    brand: i.product?.brand?.name || "Sudha Collections",
    color: i.variant?.color || "Standard",
    size: i.variant?.size || "Free Size",
    fabric: i.product?.fabric || "Silk",
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    totalPrice: i.totalPrice,
    orderStatus: i.order.status,
    paymentStatus: i.order.paymentStatus,
    customerName: i.order.shippingName,
    shippingState: i.order.shippingState,
  }));

  return {
    data,
    pagination: {
      totalCount,
      totalPages,
      currentPage,
      pageSize,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    },
  };
}

/**
 * 3. GST / Tax Report with Custom Pagination
 */
export async function getGstReport(filter: DateFilter, pagination?: PaginationOptions) {
  const createdAtWhere =
    filter.start || filter.end
      ? {
        ...(filter.start ? { gte: filter.start } : {}),
        ...(filter.end ? { lte: filter.end } : {}),
      }
      : undefined;

  const whereClause: Prisma.OrderWhereInput = {
    AND: [
      placedOrderWhere,
      { paymentStatus: { in: ["PAID", "REFUNDED"] } },
      ...(createdAtWhere ? [{ createdAt: createdAtWhere }] : []),
    ],
  };

  const totalCount = await prisma.order.count({ where: whereClause });
  const currentPage = Math.max(1, pagination?.page || 1);
  const pageSize = pagination ? Math.min(100, Math.max(1, pagination.pageSize || 25)) : Math.max(1, totalCount);
  const skip = pagination ? (currentPage - 1) * pageSize : 0;
  const take = pagination ? pageSize : undefined;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const orders = await prisma.order.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  const data = orders.map((o) => {
    const taxableValue = o.subtotal - o.discount > 0 ? o.subtotal - o.discount : 0;
    const taxAmount = o.tax > 0 ? o.tax : Number((taxableValue * 0.05).toFixed(2));

    const isKarnataka =
      o.shippingState?.toLowerCase().includes("karnataka") ||
      o.billingState?.toLowerCase().includes("karnataka");

    const cgst = isKarnataka ? Number((taxAmount / 2).toFixed(2)) : 0;
    const sgst = isKarnataka ? Number((taxAmount / 2).toFixed(2)) : 0;
    const igst = !isKarnataka ? Number(taxAmount.toFixed(2)) : 0;

    return {
      orderNumber: o.orderNumber,
      orderDate: o.createdAt,
      customerName: o.shippingName,
      shippingState: o.shippingState,
      shippingPincode: o.shippingPincode,
      taxableAmount: taxableValue,
      gstRate: "5%",
      cgst,
      sgst,
      igst,
      totalGst: taxAmount,
      totalInvoiceAmount: o.total,
    };
  });

  return {
    data,
    pagination: {
      totalCount,
      totalPages,
      currentPage,
      pageSize,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    },
  };
}

/**
 * 4. Inventory Valuation & Stock Report with Custom Pagination
 */
export async function getInventoryReport(stockFilter?: "all" | "low" | "out", pagination?: PaginationOptions) {
  const where: Prisma.InventoryWhereInput = {};
  if (stockFilter === "low") {
    where.availableStock = { gt: 0, lte: 5 };
  } else if (stockFilter === "out") {
    where.availableStock = { lte: 0 };
  }

  const totalCount = await prisma.inventory.count({ where });
  const currentPage = Math.max(1, pagination?.page || 1);
  const pageSize = pagination ? Math.min(100, Math.max(1, pagination.pageSize || 25)) : Math.max(1, totalCount);
  const skip = pagination ? (currentPage - 1) * pageSize : 0;
  const take = pagination ? pageSize : undefined;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const inventoryItems = await prisma.inventory.findMany({
    where,
    include: {
      variant: {
        include: {
          product: {
            include: {
              category: { select: { name: true } },
              brand: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { availableStock: "asc" },
    skip,
    take,
  });

  const data = inventoryItems.map((inv) => {
    const v = inv.variant;
    const p = v?.product;
    const price = v?.salePrice ?? v?.price ?? p?.sellingPrice ?? 0;
    const mrp = p?.mrp ?? price;
    const totalStock = inv.availableStock + inv.reservedStock;
    const stockValuation = totalStock * price;

    let stockStatus = "In Stock";
    if (inv.availableStock <= 0) stockStatus = "Out of Stock";
    else if (inv.availableStock <= inv.lowStockThreshold) stockStatus = "Low Stock Alert";

    return {
      sku: v?.sku || "SC-SKU",
      productName: p?.name || "Product",
      category: p?.category?.name || "Apparel",
      brand: p?.brand?.name || "Sudha Collections",
      color: v?.color || "Standard",
      size: v?.size || "Standard",
      mrp,
      sellingPrice: price,
      availableStock: inv.availableStock,
      reservedStock: inv.reservedStock,
      totalStock,
      stockValuation,
      lowStockThreshold: inv.lowStockThreshold,
      stockStatus,
      lastUpdated: inv.updatedAt,
    };
  });

  return {
    data,
    pagination: {
      totalCount,
      totalPages,
      currentPage,
      pageSize,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    },
  };
}

/**
 * 5. Payment Gateway Settlements Report with Custom Pagination
 */
export async function getPaymentsReport(filter: DateFilter, pagination?: PaginationOptions) {
  const createdAtWhere =
    filter.start || filter.end
      ? {
        ...(filter.start ? { gte: filter.start } : {}),
        ...(filter.end ? { lte: filter.end } : {}),
      }
      : undefined;

  const whereClause = createdAtWhere ? { createdAt: createdAtWhere } : undefined;
  const totalCount = await prisma.payment.count({ where: whereClause });
  const currentPage = Math.max(1, pagination?.page || 1);
  const pageSize = pagination ? Math.min(100, Math.max(1, pagination.pageSize || 25)) : Math.max(1, totalCount);
  const skip = pagination ? (currentPage - 1) * pageSize : 0;
  const take = pagination ? pageSize : undefined;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const payments = await prisma.payment.findMany({
    where: whereClause,
    include: {
      order: {
        select: {
          orderNumber: true,
          shippingName: true,
          shippingPhone: true,
        },
      },
      refund: {
        select: {
          id: true,
          gatewayRefundId: true,
          status: true,
          amountPaise: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  const data = payments.map((p) => ({
    paymentId: p.id,
    orderNumber: p.order?.orderNumber || "—",
    customerName: p.order?.shippingName || "—",
    provider: p.provider,
    transactionId: p.transactionId || "—",
    gatewayOrderId: p.gatewayOrderId || "—",
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    paidAt: p.paidAt,
    refundedAmount: (p.refundedPaise || 0) / 100,
    hasRefund: Boolean(p.refund),
    refundStatus: p.refund?.status || "None",
    createdAt: p.createdAt,
    lastError: p.lastError || "None",
  }));

  return {
    data,
    pagination: {
      totalCount,
      totalPages,
      currentPage,
      pageSize,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    },
  };
}

/**
 * 6. Refunds & Cancellations Report with Custom Pagination
 */
export async function getRefundsReport(filter: DateFilter, pagination?: PaginationOptions) {
  const createdAtWhere =
    filter.start || filter.end
      ? {
        ...(filter.start ? { gte: filter.start } : {}),
        ...(filter.end ? { lte: filter.end } : {}),
      }
      : undefined;

  const whereClause = createdAtWhere ? { createdAt: createdAtWhere } : undefined;
  const totalCount = await prisma.paymentRefund.count({ where: whereClause });
  const currentPage = Math.max(1, pagination?.page || 1);
  const pageSize = pagination ? Math.min(100, Math.max(1, pagination.pageSize || 25)) : Math.max(1, totalCount);
  const skip = pagination ? (currentPage - 1) * pageSize : 0;
  const take = pagination ? pageSize : undefined;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const refunds = await prisma.paymentRefund.findMany({
    where: whereClause,
    include: {
      payment: {
        include: {
          order: {
            select: {
              orderNumber: true,
              shippingName: true,
              shippingPhone: true,
              shippingCity: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  const data = refunds.map((r) => ({
    refundId: r.id,
    orderNumber: r.payment?.order?.orderNumber || "—",
    customerName: r.payment?.order?.shippingName || "—",
    transactionId: r.payment?.transactionId || "—",
    gatewayRefundId: r.gatewayRefundId || "—",
    amount: r.amountPaise / 100,
    reason: r.reason || "Customer requested return / cancellation",
    status: r.status,
    attempts: r.attempts,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    lastError: r.lastError || "None",
  }));

  return {
    data,
    pagination: {
      totalCount,
      totalPages,
      currentPage,
      pageSize,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    },
  };
}

/**
 * 7. Patron Lifetime Value & Customer Analytics Report with Custom Pagination
 */
export async function getCustomersReport(pagination?: PaginationOptions) {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: {
      orders: {
        where: placedOrderWhere,
        select: {
          total: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
        },
      },
      addresses: {
        take: 1,
        orderBy: { isDefault: "desc" },
        select: { city: true, state: true, pincode: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const parsed = customers.map((c) => {
    const paidOrders = c.orders.filter((o) => o.paymentStatus === "PAID" || o.paymentStatus === "REFUNDED");
    const totalOrdersPlaced = paidOrders.length;
    const totalSpent = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const aov = totalOrdersPlaced > 0 ? totalSpent / totalOrdersPlaced : 0;
    const lastOrder = paidOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    return {
      customerId: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone || "—",
      city: c.addresses[0]?.city || "—",
      state: c.addresses[0]?.state || "—",
      registeredAt: c.createdAt,
      status: c.status,
      totalOrdersPlaced,
      totalSpent,
      averageOrderValue: aov,
      lastOrderDate: lastOrder?.createdAt || null,
    };
  });

  // Sort by highest lifetime spend descending
  parsed.sort((a, b) => b.totalSpent - a.totalSpent);

  const totalCount = parsed.length;
  const currentPage = Math.max(1, pagination?.page || 1);
  const pageSize = pagination ? Math.min(100, Math.max(1, pagination.pageSize || 25)) : Math.max(1, totalCount);
  const skip = pagination ? (currentPage - 1) * pageSize : 0;
  const paginatedData = pagination ? parsed.slice(skip, skip + pageSize) : parsed;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    data: paginatedData,
    pagination: {
      totalCount,
      totalPages,
      currentPage,
      pageSize,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    },
  };
}

/**
 * 8. Promo Coupons Report with Custom Pagination
 */
export async function getCouponsReport(pagination?: PaginationOptions) {
  const [coupons, ordersWithCoupons] = await Promise.all([
    prisma.coupon.findMany({
      orderBy: { startDate: "desc" },
    }),
    prisma.order.findMany({
      where: {
        AND: [
          placedOrderWhere,
          { couponCode: { not: null } },
          { paymentStatus: { in: ["PAID", "REFUNDED"] } },
        ],
      },
      select: {
        couponCode: true,
        subtotal: true,
        discount: true,
        total: true,
      },
    }),
  ]);

  const couponStats = new Map<string, { totalRevenue: number; totalDiscounts: number; count: number }>();
  for (const o of ordersWithCoupons) {
    if (!o.couponCode) continue;
    const code = o.couponCode.toUpperCase();
    const stat = couponStats.get(code) || { totalRevenue: 0, totalDiscounts: 0, count: 0 };
    stat.totalRevenue += o.total;
    stat.totalDiscounts += o.discount;
    stat.count += 1;
    couponStats.set(code, stat);
  }

  const allCoupons = coupons.map((c) => {
    const stats = couponStats.get(c.code.toUpperCase()) || {
      totalRevenue: 0,
      totalDiscounts: 0,
      count: c.usedCount,
    };

    return {
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minimumOrderAmount: c.minimumOrderAmount,
      maximumDiscount: c.maximumDiscount || "Unlimited",
      usageLimit: c.usageLimit ?? "Unlimited",
      usedCount: c.usedCount,
      revenueGenerated: stats.totalRevenue,
      totalDiscountGranted: stats.totalDiscounts,
      startDate: c.startDate,
      endDate: c.endDate,
      status: c.status,
    };
  });

  const totalCount = allCoupons.length;
  const currentPage = Math.max(1, pagination?.page || 1);
  const pageSize = pagination ? Math.min(100, Math.max(1, pagination.pageSize || 25)) : Math.max(1, totalCount);
  const skip = pagination ? (currentPage - 1) * pageSize : 0;
  const paginatedData = pagination ? allCoupons.slice(skip, skip + pageSize) : allCoupons;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    data: paginatedData,
    pagination: {
      totalCount,
      totalPages,
      currentPage,
      pageSize,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    },
  };
}
