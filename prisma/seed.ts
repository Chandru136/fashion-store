import { PrismaClient, RoleEnum, OrderStatus, PaymentStatus, DiscountType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Sudha Collections Database Seeding...");

  // 1. Roles & Permissions Setup
  const adminPassword = await bcrypt.hash("Admin@12345", 10);
  const customerPassword = await bcrypt.hash("Customer@12345", 10);

  // 2. Users Setup
  console.log("👤 Seeding Users...");
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Sudha Collections Admin",
      email: "admin@example.com",
      phone: "+91 9876543210",
      passwordHash: adminPassword,
      role: RoleEnum.SUPER_ADMIN,
      status: "ACTIVE",
    },
  });

  const demoCustomer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      name: "Priya Sharma",
      email: "customer@example.com",
      phone: "+91 9876500000",
      passwordHash: customerPassword,
      role: RoleEnum.CUSTOMER,
      status: "ACTIVE",
      addresses: {
        create: [
          {
            name: "Priya Sharma",
            phone: "+91 9876500000",
            addressLine1: "42, Regal Heights, Anna Nagar",
            addressLine2: "Near Tower Park",
            city: "Chennai",
            state: "Tamil Nadu",
            pincode: "600040",
            country: "India",
            isDefault: true,
          },
        ],
      },
    },
  });

  // Additional 20 Customers
  const customerNames = [
    "Ananya Rao", "Deepika Patel", "Meera Iyer", "Kavya Reddy", "Samyuktha Nair",
    "Pooja Deshmukh", "Sneha Sundaram", "Divya Joshi", "Ritu Sen", "Lakshmi Sundar",
    "Swati Kulkarni", "Aarthi Subramanian", "Bhavna Bhatt", "Nisha Jain", "Trisha Roy",
    "Malini Bannerjee", "Archana Murthy", "Gauri Kapoor", "Sunita Menaria", "Vandana Seth"
  ];

  const customers = [];
  for (let i = 0; i < customerNames.length; i++) {
    const cust = await prisma.user.upsert({
      where: { email: `customer${i + 1}@example.com` },
      update: {},
      create: {
        name: customerNames[i],
        email: `customer${i + 1}@example.com`,
        phone: `+91 98765${10000 + i}`,
        passwordHash: customerPassword,
        role: RoleEnum.CUSTOMER,
        status: "ACTIVE",
      },
    });
    customers.push(cust);
  }

  // 3. Brands Setup (10 Brands)
  console.log("🏷️ Seeding Brands...");
  const brandData = [
    { name: "Mayura Silks", slug: "mayura-silks", description: "Authentic Kanchipuram Pure Zari Silk Sarees", logo: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400" },
    { name: "Kaveri Handlooms", slug: "kaveri-handlooms", description: "Handwoven Cotton & Linen Ethnic Attire", logo: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400" },
    { name: "Veda Couture", slug: "veda-couture", description: "High-Fashion Royal Designer Lehengas & Anarkalis", logo: "https://images.unsplash.com/photo-1594465919760-441fe5908ab0?w=400" },
    { name: "Rajwada Heritage", slug: "rajwada-heritage", description: "Regal Royal Sherwanis & Mens Silk Wear", logo: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400" },
    { name: "Ananya Weaves", slug: "ananya-weaves", description: "Soft Silk & Chiffon Designer Sarees", logo: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400" },
    { name: "Royal Kanchi", slug: "royal-kanchi", description: "Traditional Temple Border Silk Weaves", logo: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=400" },
    { name: "Sutra Craft", slug: "sutra-craft", description: "Intricate Embroidered Dupattas & Stoles", logo: "https://images.unsplash.com/photo-1583391733975-ac9f7831d3f9?w=400" },
    { name: "Vibha Ethnic", slug: "vibha-ethnic", description: "Kids Pattu Pavadai & Festive Dhoti Sets", logo: "https://images.unsplash.com/photo-1621644860680-244365313936?w=400" },
    { name: "Chola Heritage", slug: "chola-heritage", description: "Bridal Zari & Pure Brocade Masterpieces", logo: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400" },
    { name: "Aaradhya Weaves", slug: "aaradhya-weaves", description: "Artistic Chanderi & Organza Collections", logo: "https://images.unsplash.com/photo-1594465919760-441fe5908ab0?w=400" },
  ];

  const brands = [];
  for (const b of brandData) {
    const createdBrand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: b,
    });
    brands.push(createdBrand);
  }

  // 4. Categories & Subcategories (10 main categories, 20 subcategories)
  console.log("📁 Seeding Categories...");
  const categoriesDef = [
    {
      name: "Pure Silk Sarees",
      slug: "pure-silk-sarees",
      description: "Handcrafted pure mulberry silk sarees with certified gold & silver zari.",
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
      subs: [
        { name: "Kanchipuram Bridal Silk", slug: "kanchipuram-bridal-silk" },
        { name: "Banarasi Brocade Silk", slug: "banarasi-brocade-silk" },
        { name: "Soft Silk Heritage", slug: "soft-silk-heritage" },
      ],
    },
    {
      name: "Semi Silk & Art Silk",
      slug: "semi-silk-art-silk",
      description: "Lightweight and elegant semi-silk sarees perfect for celebrations.",
      image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800",
      subs: [
        { name: "Art Silk Embellished", slug: "art-silk-embellished" },
        { name: "Printed Georgette", slug: "printed-georgette" },
      ],
    },
    {
      name: "Cotton & Handloom",
      slug: "cotton-handloom",
      description: "Breathable natural cotton and linen sarees woven by master artisans.",
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800",
      subs: [
        { name: "Chettinad Handloom Cotton", slug: "chettinad-handloom-cotton" },
        { name: "Chanderi Zari Cotton", slug: "chanderi-zari-cotton" },
        { name: "Linen Stripe Sarees", slug: "linen-stripe-sarees" },
      ],
    },
    {
      name: "Bridal Lehengas",
      slug: "bridal-lehengas",
      description: "Exquisite heavily embroidered lehenga cholis for weddings and sangeet.",
      image: "https://images.unsplash.com/photo-1594465919760-441fe5908ab0?w=800",
      subs: [
        { name: "Velvet Bridal Lehenga", slug: "velvet-bridal-lehenga" },
        { name: "Silk Flare Lehenga", slug: "silk-flare-lehenga" },
      ],
    },
    {
      name: "Anarkalis & Salwars",
      slug: "anarkalis-salwars",
      description: "Royal floor-length Anarkali suits and embellished straight cut sets.",
      image: "https://images.unsplash.com/photo-1583391733975-ac9f7831d3f9?w=800",
      subs: [
        { name: "Floor Length Silk Anarkali", slug: "floor-length-silk-anarkali" },
        { name: "Palazzo Suit Sets", slug: "palazzo-suit-sets" },
      ],
    },
    {
      name: "Mens Ethnic Wear",
      slug: "mens-ethnic-wear",
      description: "Regal silk sherwanis, bandhgalas, veshti sets, and classic kurtas.",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800",
      subs: [
        { name: "Royal Silk Sherwani", slug: "royal-silk-sherwani" },
        { name: "Silk Kurta Dhoti Set", slug: "silk-kurta-dhoti-set" },
        { name: "Nehru Jacket Combo", slug: "nehru-jacket-combo" },
      ],
    },
    {
      name: "Kids Heritage",
      slug: "kids-heritage",
      description: "Adorable Traditional Pattu Pavadai and Silk Dhoti Kurtas for kids.",
      image: "https://images.unsplash.com/photo-1621644860680-244365313936?w=800",
      subs: [
        { name: "Girls Pattu Pavadai", slug: "girls-pattu-pavadai" },
        { name: "Boys Silk Kurta Set", slug: "boys-silk-kurta-set" },
      ],
    },
    {
      name: "Festive Dupattas & Stoles",
      slug: "festive-dupattas-stoles",
      description: "Heavy Banarasi zari dupattas, Bandhani, and Organza stoles.",
      image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800",
      subs: [
        { name: "Banarasi Zari Dupatta", slug: "banarasi-zari-dupatta" },
        { name: "Phulkari & Bandhani Dupatta", slug: "phulkari-bandhani-dupatta" },
      ],
    },
    {
      name: "Temple Jewelry",
      slug: "temple-jewelry",
      description: "Traditional antique gold finish temple necklace sets and jhumkas.",
      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800",
      subs: [
        { name: "Kundan & Temple Necklaces", slug: "kundan-temple-necklaces" },
        { name: "Jhumkas & Bangles", slug: "jhumkas-bangles" },
      ],
    },
    {
      name: "Ethnic Clutch Bags",
      slug: "ethnic-clutch-bags",
      description: "Embroidered velvet potli bags and raw silk bridal clutches.",
      image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800",
      subs: [
        { name: "Zardozi Potli Bags", slug: "zardozi-potli-bags" },
      ],
    },
  ];

  const createdCategories: any = {};
  for (let i = 0; i < categoriesDef.length; i++) {
    const parentDef = categoriesDef[i];
    const parent = await prisma.category.upsert({
      where: { slug: parentDef.slug },
      update: {},
      create: {
        name: parentDef.name,
        slug: parentDef.slug,
        description: parentDef.description,
        image: parentDef.image,
        displayOrder: i + 1,
      },
    });
    createdCategories[parentDef.slug] = parent;

    for (let j = 0; j < parentDef.subs.length; j++) {
      const subDef = parentDef.subs[j];
      const sub = await prisma.category.upsert({
        where: { slug: subDef.slug },
        update: {},
        create: {
          name: subDef.name,
          slug: subDef.slug,
          description: `Premium ${subDef.name} collection.`,
          image: parentDef.image,
          parentId: parent.id,
          displayOrder: j + 1,
        },
      });
      createdCategories[subDef.slug] = sub;
    }
  }

  // 5. Banners Setup (10 Banners for Homepage Carousel & CMS)
  console.log("🎨 Seeding Banners...");
  const bannerData = [
    { title: "Kanchipuram Silk Collection 2026", subtitle: "Grand Wedding Silk Sarees Handcrafted with Certified Pure Zari", desktopImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600", mobileImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800", buttonText: "Explore Royal Silks", buttonUrl: "/category/pure-silk-sarees", displayOrder: 1 },
    { title: "The Royal Groom Heritage", subtitle: "Hand-Embroidered Velvet Sherwanis & Silk Kurta Sets", desktopImage: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1600", mobileImage: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800", buttonText: "Shop Groomswear", buttonUrl: "/category/mens-ethnic-wear", displayOrder: 2 },
    { title: "Festive Banarasi Brocades", subtitle: "Timeless Golden Weaves from the Ghats of Varanasi", desktopImage: "https://images.unsplash.com/photo-1594465919760-441fe5908ab0?w=1600", mobileImage: "https://images.unsplash.com/photo-1594465919760-441fe5908ab0?w=800", buttonText: "View Banarasi Edition", buttonUrl: "/category/banarasi-brocade-silk", displayOrder: 3 },
    { title: "Grand Bridal Lehengas", subtitle: "Heavy Zardozi Work & Rich Velvet Flares for Your Special Day", desktopImage: "https://images.unsplash.com/photo-1583391733975-ac9f7831d3f9?w=1600", mobileImage: "https://images.unsplash.com/photo-1583391733975-ac9f7831d3f9?w=800", buttonText: "Browse Lehengas", buttonUrl: "/category/bridal-lehengas", displayOrder: 4 },
    { title: "Chettinad Cotton Breeze", subtitle: "Lightweight Breathable Cotton Sarees with Heritage Borders", desktopImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1600", mobileImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800", buttonText: "Shop Cotton Handlooms", buttonUrl: "/category/cotton-handloom", displayOrder: 5 },
    { title: "Soft Silk Elegance", subtitle: "Supple, Lightweight Silk Sarees Designed for Effortless Grace", desktopImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1600", mobileImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800", buttonText: "Discover Soft Silks", buttonUrl: "/category/soft-silk-heritage", displayOrder: 6 },
    { title: "Anarkali Royal Collection", subtitle: "Floor Length Embroidered Silk Anarkali Suits", desktopImage: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=1600", mobileImage: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800", buttonText: "Shop Anarkalis", buttonUrl: "/category/anarkalis-salwars", displayOrder: 7 },
    { title: "Little Royalty Kids Wear", subtitle: "Pure Silk Pattu Pavadai & Festive Dhoti Sets for Kids", desktopImage: "https://images.unsplash.com/photo-1621644860680-244365313936?w=1600", mobileImage: "https://images.unsplash.com/photo-1621644860680-244365313936?w=800", buttonText: "Shop Kids Collection", buttonUrl: "/category/kids-heritage", displayOrder: 8 },
    { title: "Zari Dupatta Splendor", subtitle: "Heavy Statement Banarasi & Bandhani Silk Dupattas", desktopImage: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1600", mobileImage: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800", buttonText: "Shop Dupattas", buttonUrl: "/category/festive-dupattas-stoles", displayOrder: 9 },
    { title: "Antique Temple Jewelry", subtitle: "Handcrafted Antique Gold Finish Bridal Jewelry", desktopImage: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=1600", mobileImage: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800", buttonText: "Explore Jewelry", buttonUrl: "/category/temple-jewelry", displayOrder: 10 },
  ];

  for (const b of bannerData) {
    await prisma.banner.create({ data: b });
  }

  // 6. Editorial Collections Setup (6 Main Collections)
  console.log("✨ Seeding Collections...");
  const collectionsData = [
    { name: "Wedding Collection", slug: "wedding-collection", description: "Heavy pure silk sarees and bridal lehengas crafted for royal wedding ceremonies.", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800", displayOrder: 1 },
    { name: "Festive Collection", slug: "festive-collection", description: "Vibrant silk sarees, Anarkalis, and sherwanis for Diwali and festive celebrations.", image: "https://images.unsplash.com/photo-1594465919760-441fe5908ab0?w=800", displayOrder: 2 },
    { name: "Designer Silk Edition", slug: "designer-silk-edition", description: "Modern motifs blended with traditional Kanchipuram and Banarasi zari.", image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800", displayOrder: 3 },
    { name: "Cotton Handloom Stories", slug: "cotton-handloom-stories", description: "Pure Chettinad, Chanderi, and Linen hand woven comfort for daily elegance.", image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800", displayOrder: 4 },
    { name: "Royal Groom Trunk", slug: "royal-groom-trunk", description: "Bespoke Sherwanis, Silk Kurta Pajama Sets, and Embellished Jackets.", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800", displayOrder: 5 },
    { name: "New Arrivals 2026", slug: "new-arrivals-2026", description: "Fresh off the looms: latest silk color palettes and contemporary cuts.", image: "https://images.unsplash.com/photo-1583391733975-ac9f7831d3f9?w=800", displayOrder: 6 },
  ];

  for (const c of collectionsData) {
    await prisma.collection.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  // 7. Coupons Setup (10 Coupons)
  console.log("🎟️ Seeding Coupons...");
  const couponsData = [
    { code: "SUDHA10", discountType: DiscountType.PERCENTAGE, discountValue: 10, minimumOrderAmount: 2000, maximumDiscount: 1000, endDate: new Date("2027-12-31") },
    { code: "ROYALSILK15", discountType: DiscountType.PERCENTAGE, discountValue: 15, minimumOrderAmount: 10000, maximumDiscount: 3000, endDate: new Date("2027-12-31") },
    { code: "FESTIVE500", discountType: DiscountType.FIXED_AMOUNT, discountValue: 500, minimumOrderAmount: 4999, endDate: new Date("2027-12-31") },
    { code: "BRIDAL2000", discountType: DiscountType.FIXED_AMOUNT, discountValue: 2000, minimumOrderAmount: 25000, endDate: new Date("2027-12-31") },
    { code: "WELCOME100", discountType: DiscountType.FIXED_AMOUNT, discountValue: 100, minimumOrderAmount: 999, endDate: new Date("2027-12-31") },
    { code: "KANCHI20", discountType: DiscountType.PERCENTAGE, discountValue: 20, minimumOrderAmount: 15000, maximumDiscount: 5000, endDate: new Date("2027-12-31") },
    { code: "COTTON10", discountType: DiscountType.PERCENTAGE, discountValue: 10, minimumOrderAmount: 1500, maximumDiscount: 500, endDate: new Date("2027-12-31") },
    { code: "GROOM15", discountType: DiscountType.PERCENTAGE, discountValue: 15, minimumOrderAmount: 8000, maximumDiscount: 2500, endDate: new Date("2027-12-31") },
    { code: "SILKLOVE", discountType: DiscountType.FIXED_AMOUNT, discountValue: 750, minimumOrderAmount: 7500, endDate: new Date("2027-12-31") },
    { code: "FREESHIP", discountType: DiscountType.FIXED_AMOUNT, discountValue: 250, minimumOrderAmount: 1999, endDate: new Date("2027-12-31") },
  ];

  for (const c of couponsData) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  // 8. Products & Variants Setup (50 Products, 100+ Variants)
  console.log("🛍️ Seeding 50 Products & Variants...");
  const colors = ["Royal Red", "Peacock Blue", "Bottle Green", "Deep Wine", "Mustard Gold", "Blush Pink", "Obsidian Black", "Ivory Cream"];
  const sareeImages = [
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
    "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800",
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800",
    "https://images.unsplash.com/photo-1594465919760-441fe5908ab0?w=800",
    "https://images.unsplash.com/photo-1583391733975-ac9f7831d3f9?w=800",
    "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800"
  ];

  const productTemplates = [
    { title: "Maharani Pure Kanchipuram Silk Saree", catSlug: "kanchipuram-bridal-silk", fabric: "Pure Mulberry Silk", occasion: "Wedding", mrp: 24999, price: 18999, isBestseller: true, isFeatured: true },
    { title: "Swarna Mayuri Zari Kanchipuram Saree", catSlug: "kanchipuram-bridal-silk", fabric: "Pure Silk & Pure Gold Zari", occasion: "Bridal", mrp: 34999, price: 27999, isBestseller: true, isFeatured: true },
    { title: "Varanasi Royal Brocade Banarasi Saree", catSlug: "banarasi-brocade-silk", fabric: "Katan Silk", occasion: "Festive", mrp: 19999, price: 14999, isBestseller: false, isFeatured: true },
    { title: "Subhadra Soft Silk Dual Tone Saree", catSlug: "soft-silk-heritage", fabric: "Soft Silk", occasion: "Partywear", mrp: 11999, price: 8499, isBestseller: true, isFeatured: false },
    { title: "Chettinad Traditional Temple Border Cotton Saree", catSlug: "chettinad-handloom-cotton", fabric: "100% Handloom Cotton", occasion: "Daily Classic", mrp: 3499, price: 2499, isBestseller: false, isFeatured: false },
    { title: "Chanderi Gold Leaf Zari Saree", catSlug: "chanderi-zari-cotton", fabric: "Chanderi Silk Cotton", occasion: "Puja & Festive", mrp: 5999, price: 4299, isBestseller: true, isFeatured: false },
    { title: "Nur Jahan Velvet Zardozi Bridal Lehenga", catSlug: "velvet-bridal-lehenga", fabric: "Micro Velvet", occasion: "Bridal Sangeet", mrp: 45000, price: 34999, isBestseller: true, isFeatured: true },
    { title: "Choga Style Silk Anarkali Suit Set", catSlug: "floor-length-silk-anarkali", fabric: "Chanderi Silk", occasion: "Festive", mrp: 12999, price: 9499, isBestseller: false, isFeatured: true },
    { title: "Emperor Velvet Silk Sherwani Set", catSlug: "royal-silk-sherwani", fabric: "Raw Silk & Velvet", occasion: "Groom Wedding", mrp: 29999, price: 21999, isBestseller: true, isFeatured: true },
    { title: "Kaveri Mens Tussar Silk Kurta Dhoti", catSlug: "silk-kurta-dhoti-set", fabric: "Tussar Silk", occasion: "Traditional", mrp: 6999, price: 4999, isBestseller: false, isFeatured: false },
    { title: "Little Princess Pattu Pavadai Set", catSlug: "girls-pattu-pavadai", fabric: "Art Silk", occasion: "Festive Kids", mrp: 3999, price: 2799, isBestseller: true, isFeatured: false },
    { title: "Zari Jaal Banarasi Heavy Dupatta", catSlug: "banarasi-zari-dupatta", fabric: "Banarasi Silk", occasion: "Festive Accent", mrp: 4999, price: 3499, isBestseller: false, isFeatured: true },
    { title: "Antiqua Gold Temple Necklace Set", catSlug: "kundan-temple-necklaces", fabric: "Brass Gold Polish", occasion: "Bridal Accessories", mrp: 8999, price: 5999, isBestseller: true, isFeatured: true },
    { title: "Royal Zardozi Velvet Potli Bag", catSlug: "zardozi-potli-bags", fabric: "Velvet & Pearl", occasion: "Evening Accessory", mrp: 2499, price: 1699, isBestseller: false, isFeatured: false },
  ];

  const createdProducts = [];
  let prodIndex = 1;

  for (let i = 0; i < 50; i++) {
    const template = productTemplates[i % productTemplates.length];
    const cat = createdCategories[template.catSlug] || Object.values(createdCategories)[0];
    const brand = brands[i % brands.length];
    const color = colors[i % colors.length];
    const name = `${template.title} - ${color} Edition ${Math.floor(i / 14) + 1}`;
    const slug = `${template.catSlug}-${color.toLowerCase().replace(/\s+/g, "-")}-${i + 1}`;
    const sku = `ARN-2026-${1000 + i}`;

    const prod = await prisma.product.create({
      data: {
        name,
        slug,
        sku,
        description: `Experience timeless grandeur with our ${name}. Meticulously handcrafted by master artisans using authentic ${template.fabric}. Designed to elevate your wardrobe for ${template.occasion} celebrations with regal beauty and lasting grace.`,
        shortDescription: `Authentic ${template.fabric} ${template.occasion} apparel from Sudha Collections.`,
        categoryId: (cat as any).id,
        brandId: brand.id,
        mrp: template.mrp,
        sellingPrice: template.price,
        tax: 5.0,
        fabric: template.fabric,
        occasion: template.occasion,
        pattern: "Traditional Zari Motif",
        status: "ACTIVE",
        featured: template.isFeatured || (i % 5 === 0),
        bestseller: template.isBestseller || (i % 3 === 0),
        newArrival: i > 25,
        images: {
          create: [
            { url: sareeImages[i % sareeImages.length], altText: `${name} Front View`, isPrimary: true, sortOrder: 1 },
            { url: sareeImages[(i + 1) % sareeImages.length], altText: `${name} Pallu Detail`, isPrimary: false, sortOrder: 2 },
            { url: sareeImages[(i + 2) % sareeImages.length], altText: `${name} Weave Texture`, isPrimary: false, sortOrder: 3 },
          ],
        },
        variants: {
          create: [
            {
              sku: `${sku}-FREE`,
              color: color,
              size: "Free Size",
              fabric: template.fabric,
              price: template.price,
              salePrice: template.price * 0.95,
              stock: 25 + (i * 2),
              weight: 0.8,
              inventory: {
                create: {
                  availableStock: 25 + (i * 2),
                  reservedStock: 2,
                  lowStockThreshold: 5,
                },
              },
            },
            {
              sku: `${sku}-XL`,
              color: colors[(i + 1) % colors.length],
              size: "Custom Stitch / XL",
              fabric: template.fabric,
              price: template.price + 500,
              salePrice: template.price,
              stock: 12,
              weight: 0.9,
              inventory: {
                create: {
                  availableStock: 12,
                  reservedStock: 0,
                  lowStockThreshold: 3,
                },
              },
            },
          ],
        },
        reviews: {
          create: [
            {
              userId: customers[i % customers.length].id,
              rating: 5,
              title: "Exquisite Quality & Fast Shipping!",
              comment: `Absolutely breathtaking ${template.fabric}! The zari shine and texture is 100% authentic. Truly loved buying from Sudha Collections.`,
              status: "APPROVED",
            },
            {
              userId: customers[(i + 1) % customers.length].id,
              rating: 4,
              title: "Elegant Woven Saree",
              comment: "Very soft fabric and rich drape. Packaging was royal. Highly recommended!",
              status: "APPROVED",
            },
          ],
        },
      },
      include: {
        variants: true,
      },
    });
    createdProducts.push(prod);
    prodIndex++;
  }

  // 9. Seeding 50 Demo Orders
  console.log("📦 Seeding 50 Orders with Various Statuses...");
  const orderStatuses = [
    OrderStatus.DELIVERED,
    OrderStatus.DELIVERED,
    OrderStatus.SHIPPED,
    OrderStatus.PROCESSING,
    OrderStatus.CONFIRMED,
    OrderStatus.PENDING,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.PACKED,
  ];

  for (let i = 0; i < 50; i++) {
    const cust = customers[i % customers.length];
    const prod = createdProducts[i % createdProducts.length];
    const variant = prod.variants[0];
    const status = orderStatuses[i % orderStatuses.length];
    const unitPrice = variant.price;
    const subtotal = unitPrice * 1;
    const discount = i % 2 === 0 ? 500 : 0;
    const tax = Math.round(subtotal * 0.05);
    const shipping = subtotal > 2000 ? 0 : 150;
    const total = subtotal - discount + tax + shipping;

    await prisma.order.create({
      data: {
        orderNumber: `ORD-2026-${10001 + i}`,
        userId: cust.id,
        status: status,
        subtotal: subtotal,
        discount: discount,
        shipping: shipping,
        tax: tax,
        total: total,
        paymentStatus: status === OrderStatus.DELIVERED || status === OrderStatus.SHIPPED ? PaymentStatus.PAID : PaymentStatus.PENDING,
        paymentMethod: i % 2 === 0 ? "ONLINE" : "COD",
        shippingName: cust.name,
        shippingPhone: cust.phone || "+91 9876543210",
        shippingAddress: `${10 + i}, Royal Heritage Garden, MG Road`,
        shippingCity: i % 2 === 0 ? "Chennai" : "Bengaluru",
        shippingState: i % 2 === 0 ? "Tamil Nadu" : "Karnataka",
        shippingPincode: "600001",
        trackingNumber: status === OrderStatus.SHIPPED || status === OrderStatus.DELIVERED ? `AWB987654${10 + i}` : null,
        items: {
          create: [
            {
              productId: prod.id,
              variantId: variant.id,
              productName: prod.name,
              sku: variant.sku,
              quantity: 1,
              unitPrice: unitPrice,
              totalPrice: unitPrice,
            },
          ],
        },
        payments: {
          create: [
            {
              provider: i % 2 === 0 ? "MOCK_ONLINE" : "COD",
              transactionId: `TXN-ARN-${90000 + i}`,
              amount: total,
              status: status === OrderStatus.DELIVERED || status === OrderStatus.SHIPPED ? PaymentStatus.PAID : PaymentStatus.PENDING,
              paidAt: status === OrderStatus.DELIVERED ? new Date() : null,
            },
          ],
        },
      },
    });
  }

  console.log("✅ Database seeding completed successfully!");
  console.log("----------------------------------------------");
  console.log("🔑 Demo Admin: admin@example.com / Admin@12345");
  console.log("🔑 Demo Customer: customer@example.com / Customer@12345");
  console.log("----------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
