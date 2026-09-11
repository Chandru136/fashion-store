"use client";

import React, { useState, useEffect } from "react";

interface PromoBanner {
  id: string;
  desktopImage: string;
  mobileImage?: string | null;
  title: string;
}

interface PromoBannerCarouselProps {
  banners: PromoBanner[];
}

const ROTATE_INTERVAL = 4500;

export function PromoBannerCarousel({ banners }: PromoBannerCarouselProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % banners.length);
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners || banners.length === 0) return null;

  return (
    <section className="relative w-full aspect-[4/3] sm:aspect-auto sm:h-[60vh] sm:min-h-[380px] sm:max-h-[560px] overflow-hidden">
      {banners.map((banner, idx) => (
        <picture key={banner.id}>
          {banner.mobileImage && (
            <source media="(max-width: 640px)" srcSet={banner.mobileImage} />
          )}
          <img
            src={banner.desktopImage}
            alt={banner.title}
            style={{ zIndex: idx === active ? 2 : 1 }}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ease-in-out ${
              idx === active ? "opacity-100" : "opacity-0"
            }`}
          />
        </picture>
      ))}

      {banners.length > 1 && (
        <div className="absolute bottom-3 right-4 sm:bottom-4 sm:right-10 z-20 flex items-center gap-1.5">
          {banners.map((banner, idx) => (
            <span
              key={banner.id}
              className={`h-1.5 rounded-full transition-all ${
                idx === active ? "w-5 bg-gold-300" : "w-1.5 bg-ivory-50/50"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}