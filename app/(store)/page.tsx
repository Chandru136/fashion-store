import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Flower2, Gem, HeartHandshake, Instagram, Leaf, Sparkles } from "lucide-react";
import { getHomepageData } from "@/lib/services/homepage.service";
import { getActiveBanners } from "@/app/actions/banner.actions";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { PromoBannerCarousel } from "@/components/home/PromoBannerCarousel";
import { SpinToWin } from "@/components/home/SpinToWin";
import { ProductCard, type ProductCardProps } from "@/components/product/ProductCard";
import { CollectionEdit } from "@/components/home/CollectionEdit";
import styles from "@/components/home/LandingPage.module.css";

export const revalidate = 60;

const silk = "/images/home/silk-story.jpg";
const festive = "/images/home/festive-story.jpg";
const occasion = "/images/home/heritage-story.jpg";
const edits = [
  { name: "The Silk Edit", subtitle: "Rich colour. Beautiful detail.", image: silk, href: "/products?q=silk" },
  { name: "Celebration in Colour", subtitle: "For moments that become memories.", image: festive, href: "/products?occasion=Wedding" },
  { name: "A Softer Statement", subtitle: "An effortless kind of elegance.", image: occasion, href: "/products?sort=newest" },
  { name: "The Golden Thread", subtitle: "Fall in love with the finer details.", image: silk, href: "/products?sort=featured", detail: true },
];

function Heading({ eyebrow, title, description }: { eyebrow: string; title: React.ReactNode; description?: string }) {
  return <header className={styles.heading}><span className={styles.eyebrow}>{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}<div className={styles.ornament} aria-hidden="true"><span /><Flower2 size={21} strokeWidth={1} /><span /></div></header>;
}

function PreviewCard({ index }: { index: number }) {
  const item = edits[index % edits.length];
  return <Link href={item.href} className={styles.previewCard}><div className={styles.previewImage}><img src={item.image} alt={`${item.name} styling inspiration`} loading="lazy" className={item.detail ? styles.detailCrop : undefined} /><span>Style preview</span></div><div className={styles.previewInfo}><span className={styles.eyebrow}>The Sudha Collections edit</span><h3>{item.name}</h3><p>Discover similar styles <ArrowUpRight size={15} /></p></div></Link>;
}

function ProductRow({ products }: { products: ProductCardProps[] }) {
  // These existing demo records use landscape photographs, not merchandise.
  // Keep the catalogue intact and use labelled editorial previews on the homepage.
  const temporaryPhotos = new Set([
    "/uploads/products/a5f0d584-b9c2-47eb-a6f4-418ce81f56e3.jpg",
    "/uploads/products/22ad0c4d-a54d-4c8b-a04a-d358056662ff.jpg",
    "/uploads/products/9379e00a-7453-419e-b70f-339a725cfd98.jpg",
  ]);
  const displayed = products.filter(product => !temporaryPhotos.has(product.primaryImage)).slice(0, 4);
  return <div className={styles.productGrid}>{displayed.map(product => <ProductCard key={product.id} {...product} />)}{Array.from({ length: Math.max(0, 4 - displayed.length) }, (_, index) => <PreviewCard key={`SC-preview-${index}`} index={index + displayed.length} />)}</div>;
}

export default async function HomePage() {
  const [data, promoBanners] = await Promise.all([getHomepageData(), getActiveBanners("PROMO")]);
  const heroBanners = data.banners.filter(banner => banner.placement === "HERO");
  const categories = data.categories.map((category, index) => ({ name: category.name, image: category.image || [silk, festive, occasion][index % 3], href: `/category/${category.slug}` }));
  const categoryIdeas = [
    { name: "Silk Sarees", image: silk, href: "/products?q=silk" },
    { name: "Bridal Edit", image: festive, href: "/products?occasion=Wedding" },
    { name: "Festive Favourites", image: festive, href: "/products?occasion=Festive" },
    { name: "Everyday Elegance", image: occasion, href: "/products?q=cotton" },
    { name: "New Weaves", image: silk, href: "/products?sort=newest" },
    { name: "Occasion Wear", image: occasion, href: "/products?sort=featured" },
    { name: "Gifting Edit", image: festive, href: "/products?sort=price_asc" },
    { name: "All Collections", image: silk, href: "/products" },
  ];
  const allCategories = [...categories, ...categoryIdeas].slice(0, 8);
  const collections = data.collections.length ? data.collections.map(item => ({ name: item.name, subtitle: item.description || "A new expression of tradition.", image: item.image, href: `/products?q=${encodeURIComponent(item.name)}` })) : edits;

  return <div className={styles.landing}>
    <HeroCarousel banners={heroBanners.length ? heroBanners : [{ id: "SC-hero", title: "Tradition, beautifully reimagined.", subtitle: "The Sudha Collections celebration edit", desktopImage: festive, buttonText: "Discover the collection", buttonUrl: "/products" }]} />
    <SpinToWin />

    <section className={`${styles.section} ${styles.light}`} aria-labelledby="lookbook-heading">
      <div className={styles.container}>
        <header className={styles.heading}><span className={styles.eyebrow}>A little tradition. A little you.</span><h2 id="lookbook-heading">Every drape tells <em>a story.</em></h2><p>Meet the colours, textures and details of your next favourite.</p></header>
        <div className={styles.storyGrid}>{edits.map((item, index) => <Link key={item.name} href={item.href} className={styles.storyCard}><img src={item.image} alt={item.name} loading="lazy" className={item.detail ? styles.detailCrop : undefined} /><span className={styles.storyNumber}>0{index + 1} / THE EDIT</span><div className={styles.cardCaption}><p>{item.subtitle}</p><h3>{item.name}</h3><span>Explore the edit <ArrowUpRight size={17} /></span></div></Link>)}</div>
      </div>
    </section>

    <section className={`${styles.section} ${styles.dark}`}>
      <div className={`${styles.container} ${styles.editorialLayout}`}>
        <div className={styles.editorialIntro}><Flower2 size={44} strokeWidth={1} /><span className={styles.eyebrow}>Chosen with love</span><h2>Our world of <em>beautiful weaves.</em></h2><p>From the first festive invitation to your most treasured day, find a collection that feels like you.</p><Link className={styles.textLink} href="/products">Discover all collections <ArrowRight size={17} /></Link></div>
        <CollectionEdit collections={collections} />
      </div>
    </section>

    <section className={`${styles.section} ${styles.light}`}>
      <div className={styles.container}><Heading eyebrow="Find your favourite" title={<>A collection for <em>every you.</em></>} description="Beautiful beginnings, everyday favourites and everything in between." /><div className={styles.categoryRow}>{allCategories.map((category, index) => <Link href={category.href} key={`${category.name}-${index}`} className={styles.category}><div><img src={category.image} alt={category.name} loading="lazy" /></div><span>{category.name}</span></Link>)}</div></div>
    </section>

    <section className={`${styles.section} ${styles.dark}`}>
      <div className={styles.container}><Heading eyebrow="The favourites edit" title={<>Treasured styles. <em>Timeless appeal.</em></>} description="A closer look at our bestseller selection and styles to inspire your next drape." /><ProductRow products={data.bestsellers} /><div className={styles.center}><Link href="/products?sort=bestseller" className={styles.textLink}>Shop bestsellers <ArrowRight size={17} /></Link></div></div>
    </section>

    <section className={`${styles.section} ${styles.light}`}>
      <div className={styles.container}><Heading eyebrow="Beyond the everyday" title={<>Make room for <em>something special.</em></>} description="Distinctive edits, thoughtfully brought together for your wardrobe." /><div className={styles.collectionGrid}>{edits.map(item => <Link key={item.name} href={item.href} className={styles.collectionCard}><div><img src={item.image} alt={item.name} loading="lazy" className={item.detail ? styles.detailCrop : undefined} /></div><span className={styles.eyebrow}>{item.subtitle}</span><h3>{item.name}</h3><span className={styles.textLink}>Explore collection <ArrowUpRight size={16} /></span></Link>)}</div></div>
    </section>

    <section className={`${styles.section} ${styles.dark}`}>
      <div className={styles.container}><Heading eyebrow="A fresh chapter" title={<>New arrivals, <em>new possibilities.</em></>} description="Fresh colours and beautiful details for the moments still to come." /><ProductRow products={data.newArrivals} /><div className={styles.center}><Link href="/products?sort=newest" className={styles.textLink}>Discover new arrivals <ArrowRight size={17} /></Link></div></div>
    </section>

    <section className={`${styles.section} ${styles.light} ${styles.templeSection}`}>
      <div className={`${styles.container} ${styles.templeLayout}`}><div className={styles.editorialIntro}><img src="/peacock-feather.svg" alt="" className={styles.feather} /><span className={styles.eyebrow}>Rooted in tradition</span><h2>Inspired by heritage.<br /><em>Made for your story.</em></h2><p>The graceful lines of a gopuram. The richness of a festive drape. Discover a celebration of South Indian colour and timeless style.</p><Link href="/products?sort=featured" className={styles.textLink}>Find your celebration <ArrowRight size={17} /></Link></div><div className={styles.templeGrid}>{[{ ...edits[0], name: "The Heritage Edit" }, { ...edits[1], name: "A Festive Reverie" }, { ...edits[2], name: "Modern Heirlooms" }].map(item => <Link key={item.name} href={item.href} className={styles.templeCard}><div className={styles.gopuramFrame}><div className={styles.gopuramImage}><img src={item.image} alt={item.name} loading="lazy" /><div className={styles.cardCaption}><Flower2 size={24} strokeWidth={1} /><h3>{item.name}</h3><p>Collection</p><span className={styles.templeShop}>Shop now</span></div></div></div><span className={styles.textLink}>Shop the edit <ArrowUpRight size={16} /></span></Link>)}</div></div>
    </section>

    <section className={`${styles.campaign} ${styles.dark}`}>
      {promoBanners.length ? <PromoBannerCarousel banners={promoBanners} /> : <><img src={festive} alt="Festive silk and gold details from the Sudha Collections lookbook" loading="lazy" /><div className={styles.campaignCopy}><span className={styles.eyebrow}>For the moments that stay</span><h2>A little silk.<br /><em>A lifetime of memories.</em></h2><Link href="/products?occasion=Wedding" className={styles.button}>Explore occasion wear <ArrowRight size={17} /></Link></div></>}
    </section>

    <section className={`${styles.section} ${styles.light}`}>
      <div className={styles.container}><div className={styles.values}>{[{ Icon: Gem, title: "Distinctively Curated", copy: "Pieces with a personality of their own." }, { Icon: Flower2, title: "Tradition, Reimagined", copy: "A love for the details that endure." }, { Icon: Leaf, title: "A Modern Point of View", copy: "Timeless beauty for the way you dress today." }, { Icon: HeartHandshake, title: "A Personal Connection", copy: "Thoughtfully chosen, with you in mind." }].map(({ Icon, title, copy }) => <div key={title}><Icon size={38} strokeWidth={1.2} /><h3>{title}</h3><p>{copy}</p></div>)}</div></div>
    </section>

    <section className={`${styles.section} ${styles.dark}`}>
      <div className={styles.container}><Heading eyebrow="The world of Sudha Collections" title={<>More than <em>a beautiful drape.</em></>} /><div className={styles.worldGrid}>{[{ name: "Our Story", subtitle: "Get to know Sudha Collections", image: festive, href: "#our-story" }, { name: "Insta Collection", subtitle: "Style worth saving", image: silk, href: "#insta-collection" }, { name: "The Style Journal", subtitle: "Little details. Lovely ideas.", image: occasion, href: "#style-journal" }].map(item => <Link className={styles.worldCard} key={item.name} href={item.href}><img src={item.image} alt={item.name} loading="lazy" /><div className={styles.cardCaption}><p>{item.subtitle}</p><h3>{item.name} <ArrowUpRight size={23} /></h3></div></Link>)}</div></div>
    </section>

    <section id="our-story" className={`${styles.section} ${styles.light}`}><div className={`${styles.container} ${styles.aboutLayout}`}><div className={styles.aboutImage}><img src={silk} alt="A richly detailed saree in the Sudha Collections style edit" loading="lazy" /></div><div className={styles.editorialIntro}><span className={styles.eyebrow}>About Sudha Collections</span><h2>For the love of <em>beautiful traditions.</em></h2><p>Some clothes are more than something to wear. They become part of a celebration, a family photograph, a memory you return to.</p><p>At Sudha Collections, our edit brings together expressive colours, graceful silhouettes and an enduring love for Indian occasion wear. From a simple everyday drape to a statement for your special day, there is a story waiting to be yours.</p><Link href="/products" className={styles.textLink}>Begin your story <ArrowRight size={17} /></Link></div></div></section>

    <section id="insta-collection" className={`${styles.section} ${styles.dark}`}><div className={styles.container}><Heading eyebrow="The social edit" title={<>A little inspiration, <em>every day.</em></>} description="Save a colour story. Discover a new drape. Make the look your own." /><div className={styles.socialGrid}>{[...edits, edits[1], edits[2]].map((item, index) => <Link key={`SC-social-${index}`} href={item.href} className={styles.socialCard} aria-label={`Explore ${item.name}`}><img src={item.image} alt={`${item.name} outfit inspiration`} loading="lazy" className={item.detail ? styles.detailCrop : undefined} /><Instagram size={23} /></Link>)}</div><p className={styles.socialNote}>The Sudha Collections inspiration gallery</p></div></section>

    <section id="style-journal" className={`${styles.section} ${styles.light}`}><div className={styles.container}><Heading eyebrow="Notes from the style journal" title={<>The art of <em>wearing it your way.</em></>} /><div className={styles.journalGrid}>{[{ title: "Let the border do the talking", copy: "Pair a richly detailed drape with a simple blouse and one considered piece of jewellery. Give the weave room to shine.", image: silk }, { title: "Find your celebration colour", copy: "Warm pinks, deep jewel tones or a gentle neutral: begin with the colour that makes you feel most like yourself.", image: festive }, { title: "Keep your favourites beautiful", copy: "Follow each garment’s care label, store away from direct sunlight and give delicate pieces space between wears.", image: occasion }].map(item => <article key={item.title} className={styles.journalCard}><img src={item.image} alt="" loading="lazy" /><div><Sparkles size={19} strokeWidth={1.2} /><h3>{item.title}</h3><p>{item.copy}</p></div></article>)}</div></div></section>
  </div>;
}
