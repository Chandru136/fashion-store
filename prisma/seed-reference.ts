import type { PrismaClient } from "@prisma/client";

// Sudha Collections reference taxonomy only. Existing records are never overwritten.
export const referenceCategories = [
  {
    "name": "Pure Silk Sarees",
    "slug": "pure-silk-sarees",
    "subs": [
      {
        "name": "Kanchipuram Bridal Silk",
        "slug": "kanchipuram-bridal-silk"
      },
      {
        "name": "Banarasi Brocade Silk",
        "slug": "banarasi-brocade-silk"
      },
      {
        "name": "Soft Silk Heritage",
        "slug": "soft-silk-heritage"
      }
    ]
  },
  {
    "name": "Semi Silk & Art Silk",
    "slug": "semi-silk-art-silk",
    "subs": [
      {
        "name": "Art Silk Embellished",
        "slug": "art-silk-embellished"
      },
      {
        "name": "Printed Georgette",
        "slug": "printed-georgette"
      }
    ]
  },
  {
    "name": "Cotton & Handloom",
    "slug": "cotton-handloom",
    "subs": [
      {
        "name": "Chettinad Handloom Cotton",
        "slug": "chettinad-handloom-cotton"
      },
      {
        "name": "Chanderi Zari Cotton",
        "slug": "chanderi-zari-cotton"
      },
      {
        "name": "Linen Stripe Sarees",
        "slug": "linen-stripe-sarees"
      }
    ]
  },
  {
    "name": "Bridal Lehengas",
    "slug": "bridal-lehengas",
    "subs": [
      {
        "name": "Velvet Bridal Lehenga",
        "slug": "velvet-bridal-lehenga"
      },
      {
        "name": "Silk Flare Lehenga",
        "slug": "silk-flare-lehenga"
      }
    ]
  },
  {
    "name": "Anarkalis & Salwars",
    "slug": "anarkalis-salwars",
    "subs": [
      {
        "name": "Floor Length Silk Anarkali",
        "slug": "floor-length-silk-anarkali"
      },
      {
        "name": "Palazzo Suit Sets",
        "slug": "palazzo-suit-sets"
      }
    ]
  },
  {
    "name": "Mens Ethnic Wear",
    "slug": "mens-ethnic-wear",
    "subs": [
      {
        "name": "Royal Silk Sherwani",
        "slug": "royal-silk-sherwani"
      },
      {
        "name": "Silk Kurta Dhoti Set",
        "slug": "silk-kurta-dhoti-set"
      },
      {
        "name": "Nehru Jacket Combo",
        "slug": "nehru-jacket-combo"
      }
    ]
  },
  {
    "name": "Kids Heritage",
    "slug": "kids-heritage",
    "subs": [
      {
        "name": "Girls Pattu Pavadai",
        "slug": "girls-pattu-pavadai"
      },
      {
        "name": "Boys Silk Kurta Set",
        "slug": "boys-silk-kurta-set"
      }
    ]
  },
  {
    "name": "Festive Dupattas & Stoles",
    "slug": "festive-dupattas-stoles",
    "subs": [
      {
        "name": "Banarasi Zari Dupatta",
        "slug": "banarasi-zari-dupatta"
      },
      {
        "name": "Phulkari & Bandhani Dupatta",
        "slug": "phulkari-bandhani-dupatta"
      }
    ]
  },
  {
    "name": "Temple Jewelry",
    "slug": "temple-jewelry",
    "subs": [
      {
        "name": "Kundan & Temple Necklaces",
        "slug": "kundan-temple-necklaces"
      },
      {
        "name": "Jhumkas & Bangles",
        "slug": "jhumkas-bangles"
      }
    ]
  },
  {
    "name": "Ethnic Clutch Bags",
    "slug": "ethnic-clutch-bags",
    "subs": [
      {
        "name": "Zardozi Potli Bags",
        "slug": "zardozi-potli-bags"
      }
    ]
  }
];
export async function seedReferenceData(prisma: Pick<PrismaClient, "$transaction">) {
  await prisma.$transaction(async tx => {
    for (const [index, category] of referenceCategories.entries()) {
      const parent = await tx.category.upsert({ where: { slug: category.slug }, update: {},
        create: { name: category.name, slug: category.slug, displayOrder: index + 1 } });
      for (const [position, child] of category.subs.entries()) {
        await tx.category.upsert({ where: { slug: child.slug }, update: {},
          create: { ...child, parentId: parent.id, displayOrder: position + 1 } });
      }
    }
  });
}
