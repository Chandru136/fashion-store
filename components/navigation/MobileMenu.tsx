"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, User, X, Search, LogOut, ChevronDown } from "lucide-react";
import { menuItems } from "./navigation-data";
import styles from "./Header.module.css";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  user?: { name: string; role: string } | null;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onSignOut: () => void;
}

export function MobileMenu({ open, onClose, user, cartCount, wishlistCount, onOpenCart, onSignOut }: MobileMenuProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeCallback = useRef(onClose);
  closeCallback.current = onClose;

  useEffect(() => {
    const element = dialog.current;
    if (!element || !open) return;
    element.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 1280px)");
    const onResize = () => { if (desktop.matches) closeCallback.current(); };
    desktop.addEventListener("change", onResize);
    return () => {
      desktop.removeEventListener("change", onResize);
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <dialog ref={dialog} id="mobile-navigation" className={styles.drawer} aria-labelledby="mobile-menu-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX > bounds.right || event.clientX < bounds.left || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}>
      <div className={styles.drawerHeader}>
        <h2 id="mobile-menu-title">Sudha Collections</h2>
        <button type="button" onClick={onClose} aria-label="Close menu" autoFocus><X size={22} /></button>
      </div>
      <form action="/search" className={styles.drawerSearch} onSubmit={onClose}>
        <input name="q" type="search" aria-label="Search products" placeholder="Search sarees, silks and more" required />
        <button type="submit" aria-label="Submit search"><Search size={20} /></button>
      </form>
      <nav aria-label="Mobile navigation" onClick={(event) => { if ((event.target as HTMLElement).closest("a")) onClose(); }}>
        <div className={styles.quickLinks}>
          <Link href="/wishlist"><Heart size={20} /> Wishlist <span>{wishlistCount}</span></Link>
          <button type="button" onClick={() => { onClose(); onOpenCart(); }}><ShoppingBag size={20} /> Shopping bag <span>{cartCount}</span></button>
          <Link href="/cart">View cart & checkout</Link>
        </div>
        <Link href="/products" className={styles.menuLink}>Shop all collections</Link>
        <Link href="/products?sort=newest" className={styles.menuLink}>New arrivals</Link>
        {menuItems.map(item => (
          <details key={item.id} className={styles.categoryGroup}>
            <summary>{item.label}<ChevronDown size={17} /></summary>
            <div className={styles.submenu}>
              {item.categories.map(category => <Link key={category.name} href={category.href}>{category.name}</Link>)}
              {item.priceRanges.length > 0 && <><h3>Shop by price</h3>{item.priceRanges.map(price => <Link key={price.label} href={price.href}>{price.label}</Link>)}</>}
              {item.brands.length > 0 && <><h3>Featured brands</h3>{item.brands.map(brand => <Link key={brand.name} href={brand.href}>{brand.name}</Link>)}</>}
              <Link href={item.banner.href}>{item.banner.title}</Link>
            </div>
          </details>
        ))}
        <div className={styles.accountLinks}>
          <h3>Your account</h3>
          {user ? <>
            <Link href="/profile"><User size={19} /> My profile</Link>
            <Link href="/orders">Order history</Link>
            <Link href="/addresses">Saved addresses</Link>
            {user.role !== "CUSTOMER" && <Link href="/admin">Admin dashboard</Link>}
            <button type="button" onClick={() => { onClose(); onSignOut(); }}><LogOut size={18} /> Sign out</button>
          </> : <><Link href="/login"><User size={19} /> Customer login</Link><Link href="/register">Create an account</Link></>}
          <Link href="/#our-story">About Sudha Collections</Link>
          <Link href="/#insta-collection">Insta collection</Link>
          <Link href="/#style-journal">Style journal</Link>
        </div>
      </nav>
    </dialog>
  );
}
