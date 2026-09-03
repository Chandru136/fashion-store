"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  desktopImage: string;
  mobileImage?: string | null;
  buttonText?: string | null;
  buttonUrl?: string | null;
}

interface HeroCarouselProps {
  banners: Banner[];
}

const AUTOPLAY_INTERVAL = 5000;

export function HeroCarousel({ banners }: HeroCarouselProps) {
  const [active, setActive] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      setActive(((index % banners.length) + banners.length) % banners.length);
    },
    [banners.length]
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [next, banners.length]);

  if (!banners || banners.length === 0) return null;

  return (
    <section className="relative w-full h-[70vh] min-h-[420px] max-h-[720px] overflow-hidden bg-wine-900">
      {banners.map((banner, idx) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            idx === active ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
          aria-hidden={idx !== active}
        >
          {/* Full-bleed image — no boxed card, no border, edge to edge */}
          <picture>
            {banner.mobileImage && (
              <source media="(max-width: 640px)" srcSet={banner.mobileImage} />
            )}
            <img
              src={banner.desktopImage}
              alt={banner.title}
              className="w-full h-full object-cover"
              loading={idx === 0 ? "eager" : "lazy"}
            />
          </picture>

          {/* Minimal gradient — just enough for text legibility, not a heavy overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-wine-950/70 via-wine-900/10 to-transparent sm:bg-gradient-to-r sm:from-wine-950/60 sm:via-wine-900/10 sm:to-transparent" />

          {/* Text block — bottom-left on mobile, left-third on desktop, Pothys-style restraint */}
          <div className="absolute inset-0 flex items-end sm:items-center">
            <div className="max-w-7xl mx-auto px-6 sm:px-10 w-full">
              <div className="max-w-md space-y-3 pb-10 sm:pb-0 text-ivory-50">
                {banner.subtitle && (
                  <span className="inline-block text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase text-gold-300">
                    {banner.subtitle}
                  </span>
                )}
                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                  {banner.title}
                </h1>
                {banner.buttonText && banner.buttonUrl && (
                  <div className="pt-2">
                    <Link
                      href={banner.buttonUrl}
                      className="inline-flex items-center gap-2 px-7 py-3 bg-ivory-50 text-wine-900 font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-300 transition-colors"
                    >
                      {banner.buttonText}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Arrow navigation — subtle, appears on hover on desktop */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-ivory-50/80 text-wine-900 hover:bg-ivory-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-ivory-50/80 text-wine-900 hover:bg-ivory-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dot indicators — Pothys' "Go to item N" pattern */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {banners.map((banner, idx) => (
              <button
                key={banner.id}
                onClick={() => goTo(idx)}
                aria-label={`Go to item ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx === active ? "w-6 bg-gold-300" : "w-1.5 bg-ivory-50/50 hover:bg-ivory-50/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}