export const menuItems = [
    {
      id: "pure-silk",
      label: "PURE SILK",
      featuredBadge: "Pattu",
      categories: [
        { name: "Kanchipuram Pure Silk", slug: "kanchipuram-bridal-silk", href: "/category/kanchipuram-bridal-silk" },
        { name: "Banarasi Brocade Silk", slug: "banarasi-brocade-silk", href: "/category/banarasi-brocade-silk" },
        { name: "Soft Silk Heritage", slug: "soft-silk-heritage", href: "/category/soft-silk-heritage" },
        { name: "Traditional Wedding Silk", slug: "pure-silk-sarees", href: "/category/pure-silk-sarees" },
      ],
      priceRanges: [
        { label: "Under ₹5,000", href: "/products?maxPrice=5000" },
        { label: "₹5,000 – ₹10,000", href: "/products?minPrice=5000&maxPrice=10000" },
        { label: "₹10,000 – ₹20,000", href: "/products?minPrice=10000&maxPrice=20000" },
        { label: "₹20,000+", href: "/products?minPrice=20000" },
      ],
      brands: [
        { name: "Mayura Silks", href: "/products?brand=mayura-silks" },
        { name: "Royal Kanchi", href: "/products?brand=royal-kanchi" },
        { name: "Chola Heritage", href: "/products?brand=chola-heritage" },
      ],
      banner: {
        title: "Kanchipuram Royal Silk 2026",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600",
        href: "/category/kanchipuram-bridal-silk",
      },
    },
    {
      id: "semi-silk",
      label: "SEMI SILK",
      categories: [
        { name: "Art Silk Embellished", slug: "art-silk-embellished", href: "/category/art-silk-embellished" },
        { name: "Printed Georgette", slug: "printed-georgette", href: "/category/printed-georgette" },
        { name: "Chiffon Festive Sarees", slug: "semi-silk-art-silk", href: "/category/semi-silk-art-silk" },
      ],
      priceRanges: [
        { label: "Under ₹2,000", href: "/products?maxPrice=2000" },
        { label: "₹2,000 – ₹5,000", href: "/products?minPrice=2000&maxPrice=5000" },
      ],
      brands: [
        { name: "Ananya Weaves", href: "/products?brand=ananya-weaves" },
        { name: "Aaradhya Weaves", href: "/products?brand=aaradhya-weaves" },
      ],
      banner: {
        title: "Chiffon & Georgette Edition",
        image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600",
        href: "/category/semi-silk-art-silk",
      },
    },
    {
      id: "cotton",
      label: "COTTON & HANDLOOM",
      categories: [
        { name: "Chettinad Handloom Cotton", slug: "chettinad-handloom-cotton", href: "/category/chettinad-handloom-cotton" },
        { name: "Chanderi Zari Cotton", slug: "chanderi-zari-cotton", href: "/category/chanderi-zari-cotton" },
        { name: "Linen Stripe Sarees", slug: "linen-stripe-sarees", href: "/category/linen-stripe-sarees" },
      ],
      priceRanges: [
        { label: "Under ₹1,500", href: "/products?maxPrice=1500" },
        { label: "₹1,500 – ₹3,500", href: "/products?minPrice=1500&maxPrice=3500" },
      ],
      brands: [
        { name: "Kaveri Handlooms", href: "/products?brand=kaveri-handlooms" },
      ],
      banner: {
        title: "Breathable Cotton Comfort",
        image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600",
        href: "/category/cotton-handloom",
      },
    },
    {
      id: "women",
      label: "WOMEN",
      categories: [
        { name: "Bridal Silk Lehengas", slug: "bridal-lehengas", href: "/category/bridal-lehengas" },
        { name: "Floor Length Silk Anarkalis", slug: "floor-length-silk-anarkali", href: "/category/floor-length-silk-anarkali" },
        { name: "Palazzo Suit Sets", slug: "anarkalis-salwars", href: "/category/anarkalis-salwars" },
      ],
      priceRanges: [
        { label: "Under ₹5,000", href: "/products?maxPrice=5000" },
        { label: "₹5,000 – ₹15,000", href: "/products?minPrice=5000&maxPrice=15000" },
        { label: "₹15,000+", href: "/products?minPrice=15000" },
      ],
      brands: [
        { name: "Veda Couture", href: "/products?brand=veda-couture" },
      ],
      banner: {
        title: "Royal Couture Lehengas",
        image: "https://images.unsplash.com/photo-1594465919760-441fe5908ab0?w=600",
        href: "/category/bridal-lehengas",
      },
    },
    {
      id: "men",
      label: "MEN",
      categories: [
        { name: "Royal Silk Sherwanis", slug: "royal-silk-sherwani", href: "/category/royal-silk-sherwani" },
        { name: "Silk Kurta Dhoti Sets", slug: "silk-kurta-dhoti-set", href: "/category/silk-kurta-dhoti-set" },
        { name: "Nehru Jacket Combos", slug: "mens-ethnic-wear", href: "/category/mens-ethnic-wear" },
      ],
      priceRanges: [
        { label: "Under ₹4,000", href: "/products?maxPrice=4000" },
        { label: "₹4,000 – ₹10,000", href: "/products?minPrice=4000&maxPrice=10000" },
        { label: "₹10,000+", href: "/products?minPrice=10000" },
      ],
      brands: [
        { name: "Rajwada Heritage", href: "/products?brand=rajwada-heritage" },
      ],
      banner: {
        title: "Royal Groom Heritage",
        image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600",
        href: "/category/mens-ethnic-wear",
      },
    },
    {
      id: "kids",
      label: "KIDS",
      categories: [
        { name: "Girls Pattu Pavadai", slug: "girls-pattu-pavadai", href: "/category/girls-pattu-pavadai" },
        { name: "Boys Silk Kurta Sets", slug: "kids-heritage", href: "/category/kids-heritage" },
      ],
      priceRanges: [
        { label: "Under ₹2,500", href: "/products?maxPrice=2500" },
        { label: "₹2,500+", href: "/products?minPrice=2500" },
      ],
      brands: [
        { name: "Vibha Ethnic", href: "/products?brand=vibha-ethnic" },
      ],
      banner: {
        title: "Little Royalty Collection",
        image: "https://images.unsplash.com/photo-1621644860680-244365313936?w=600",
        href: "/category/kids-heritage",
      },
    },
    {
      id: "collections",
      label: "COLLECTIONS",
      categories: [
        { name: "Wedding Collection", slug: "wedding-collection", href: "/products?collection=wedding-collection" },
        { name: "Festive Collection", slug: "festive-collection", href: "/products?collection=festive-collection" },
        { name: "Designer Silk Edition", slug: "designer-silk-edition", href: "/products?collection=designer-silk-edition" },
        { name: "Cotton Handloom Stories", slug: "cotton-handloom-stories", href: "/products?collection=cotton-handloom-stories" },
      ],
      priceRanges: [],
      brands: [],
      banner: {
        title: "Editorial Collections 2026",
        image: "https://images.unsplash.com/photo-1583391733975-ac9f7831d3f9?w=600",
        href: "/products",
      },
    },
  ];
