"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import styles from "./LandingPage.module.css";

interface Collection { name: string; subtitle: string; image: string; href: string }

export function CollectionEdit({ collections }: { collections: Collection[] }) {
  const [active, setActive] = useState(0);
  const visible = collections.slice(active, active + 3);
  const items = [...visible, ...collections.slice(0, Math.max(0, Math.min(3, collections.length) - visible.length))];
  return <div className={styles.collectionEdit}><div className={styles.collectionTabs} aria-label="Choose a collection">{collections.map((item, index) => <button key={item.name} type="button" aria-pressed={active === index} onClick={() => setActive(index)}>{item.name}</button>)}</div><div className={styles.editGrid} aria-live="polite">{items.map(item => <Link href={item.href} className={styles.editCard} key={item.name}><img src={item.image} alt={item.name} loading="lazy" /><div className={styles.cardCaption}><h3>{item.name}</h3><span>Discover <ArrowUpRight size={16} /></span></div></Link>)}</div></div>;
}
