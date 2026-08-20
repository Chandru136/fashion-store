import { prisma } from "@/lib/db";

export async function getInventoryOverview() {
  const [totalStockResult, lowStockCount, outOfStockCount, items] = await Promise.all([
    prisma.inventory.aggregate({
      _sum: { availableStock: true, reservedStock: true },
    }),
    prisma.inventory.count({
      where: {
        availableStock: { lte: 5, gt: 0 },
      },
    }),
    prisma.inventory.count({
      where: { availableStock: 0 },
    }),
    prisma.inventory.findMany({
      include: {
        variant: {
          include: {
            product: { select: { name: true, sku: true, category: { select: { name: true } } } },
          },
        },
      },
      orderBy: { availableStock: "asc" },
      take: 50,
    }),
  ]);

  return {
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
