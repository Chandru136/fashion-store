import type { Prisma } from "@prisma/client";
import { pagination, value, choice, type ListParams } from "@/lib/listing";
import { prisma } from "@/lib/db";

export async function getInventoryOverview(params: ListParams = {}) {
  const q = value(params, "q");
  const stock = choice(params, "stock", ["LOW_STOCK", "OUT_OF_STOCK", "IN_STOCK"]);
  const sort = choice(params, "sort", ["stock_asc", "stock_desc"], "stock_asc");
  const where: Prisma.InventoryWhereInput = {
    ...(q ? { variant: { OR: [{ sku: { contains: q, mode: "insensitive" } }, { product: { name: { contains: q, mode: "insensitive" } } }] } } : {}),
    ...(stock === "OUT_OF_STOCK" ? { availableStock: 0 } : stock === "LOW_STOCK" ? { availableStock: { gt: 0, lte: prisma.inventory.fields.lowStockThreshold } } : stock === "IN_STOCK" ? { availableStock: { gt: prisma.inventory.fields.lowStockThreshold } } : {}),
  };
  const paging = pagination(await prisma.inventory.count({ where }), value(params, "page"));
  const [totalStockResult, lowStockCount, outOfStockCount, items] = await Promise.all([
    prisma.inventory.aggregate({
      _sum: { availableStock: true, reservedStock: true },
    }),
    prisma.inventory.count({
      where: {
        availableStock: { lte: prisma.inventory.fields.lowStockThreshold, gt: 0 },
      },
    }),
    prisma.inventory.count({
      where: { availableStock: 0 },
    }),
    prisma.inventory.findMany({
      where,
      include: {
        variant: {
          include: {
            product: { select: { name: true, sku: true, category: { select: { name: true } } } },
          },
        },
      },
      orderBy: [{ availableStock: sort === "stock_desc" ? "desc" : "asc" }, { id: "asc" }],
      skip: paging.skip, take: paging.take,
    }),
  ]);

  return {
    ...paging,
    totalAvailable: totalStockResult._sum.availableStock || 0,
    totalReserved: totalStockResult._sum.reservedStock || 0,
    lowStockCount,
    outOfStockCount,
    items: items.map((i) => ({
      id: i.id,
      variantId: i.variantId,
      productName: i.variant.product.name,
      sku: i.variant.sku,
      categoryName: i.variant.product.category.name,
      color: i.variant.color,
      size: i.variant.size,
      availableStock: i.availableStock,
      reservedStock: i.reservedStock,
      lowStockThreshold: i.lowStockThreshold,
      status: i.availableStock === 0 ? "OUT_OF_STOCK" : i.availableStock <= i.lowStockThreshold ? "LOW_STOCK" : "IN_STOCK",
    })),
  };
}

export async function updateStockLevel(variantId: string, newStock: number) {
  const updated = await prisma.$transaction(async (tx) => {
    const inv = await tx.inventory.upsert({
      where: { variantId },
      update: { availableStock: newStock },
      create: { variantId, availableStock: newStock, reservedStock: 0 },
    });

    await tx.productVariant.update({
      where: { id: variantId },
      data: { stock: newStock },
    });

    return inv;
  });

  return updated;
}
