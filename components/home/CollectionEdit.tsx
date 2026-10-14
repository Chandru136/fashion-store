"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import styles from "./LandingPage.module.css";

interface Collection { name: string; subtitle: string; image: string; mobileImage?: string | null; buttonText?: string | null; href: string }

export function CollectionEdit({ collections }: { collections: Collection[] }) {
  const [active, setActive] = useState(0);
  const visible = collections.slice(active, active + 3);
  const items = [...visible, ...collections.slice(0, Math.max(0, Math.min(3, collections.length) - visible.length))];
  return <div className={styles.collectionEdit}><div className={styles.collectionTabs} aria-label="Choose a collection">{collections.map((item, index) => <button key={index} type="button" aria-pressed={active === index} onClick={() => setActive(index)}>{item.name}</button>)}</div><div className={styles.editGrid} aria-live="polite">{items.map((item, index) => <Link href={item.href} className={styles.editCard} key={index}><picture>{item.mobileImage && <source media="(max-width: 640px)" srcSet={item.mobileImage} />}<img src={item.image} alt={item.name} loading="lazy" /></picture><div className={styles.cardCaption}><h3>{item.name}</h3><p>{item.subtitle}</p><span>{item.buttonText || "Discover"} <ArrowUpRight size={16} /></span></div></Link>)}</div></div>;
}
