"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Award,
  Boxes,
  ShoppingBag,
  Users,
  Ticket,
  Image as ImageIcon,
  Layers,
  Star,
  FileText,
  Sliders,
  LogOut,
  Sparkles,
} from "lucide-react";
import { logoutUser } from "@/app/actions/auth.actions";

export function AdminSidebar({ user }: { user: any }) {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Products Catalog", href: "/admin/products", icon: Package },
    { label: "Categories Tree", href: "/admin/categories", icon: FolderTree },
    { label: "Master Brands", href: "/admin/brands", icon: Award },
    { label: "Inventory Stock", href: "/admin/inventory", icon: Boxes },
    { label: "Orders & Fulfillment", href: "/admin/orders", icon: ShoppingBag },
    { label: "Customer List", href: "/admin/customers", icon: Users },
    { label: "Promo Coupons", href: "/admin/coupons", icon: Ticket },
    { label: "Homepage Hero Banners", href: "/admin/banners", icon: ImageIcon },
    { label: "Editorial Collections", href: "/admin/collections", icon: Layers },
    { label: "Patron Reviews", href: "/admin/reviews", icon: Star },
    { label: "Reports & CSV Export", href: "/admin/reports", icon: FileText },
    { label: "Homepage CMS", href: "/admin/homepage", icon: Sliders },
  ];

  return (
    <aside className="w-64 wine-gradient-bg text-ivory-100 border-r-2 border-gold-500/50 flex flex-col justify-between min-h-screen p-4 select-none">
      <div className="space-y-6">
        {/* Admin Header Branding */}
        <div className="flex items-center gap-2 px-2 pt-2 border-b border-wine-700/60 pb-4">
          <div className="w-9 h-9 bg-gold-500 text-wine-900 rounded-full flex items-center justify-center font-bold font-brand-title text-base shadow">
            SC
          </div>
          <div>
            <span className="font-brand-title text-lg font-bold text-gold-300 tracking-tight block leading-none">
              ADMIN PORTAL
            </span>
            <span className="text-[9px] font-semibold text-gold-400 tracking-widest uppercase">
              Sudha Collections
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1 text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-medium transition-all ${
                  isActive
                    ? "bg-gold-500 text-wine-900 font-bold shadow-md"
                    : "text-ivory-200 hover:bg-wine-800/80 hover:text-gold-300"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Admin User Info & Logout */}
      <div className="pt-4 border-t border-wine-700/60 text-xs space-y-3">
        <div className="px-2">
          <p className="font-bold text-gold-300">{user?.name}</p>
          <p className="text-[10px] text-ivory-300 font-mono">{user?.role}</p>
        </div>
        <Link
          href="/"
          className="w-full py-2 px-3 bg-wine-900/80 border gold-border text-gold-300 rounded font-semibold text-center block hover:bg-wine-800"
        >
          View Customer Storefront ↗
        </Link>
        <button
          onClick={async () => {
            await logoutUser();
            window.location.href = "/admin/login";
          }}
          className="w-full py-2 px-3 bg-red-900/40 text-red-200 hover:bg-red-900/70 rounded font-semibold flex items-center justify-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out Portal
        </button>
      </div>
    </aside>
  );
}
