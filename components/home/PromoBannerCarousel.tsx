"use client";

import React, { useState, useEffect } from "react";

const images = [
  "https://www.pothys.com/cdn/shop/files/main_banner_a80119d8-7784-454a-bbc1-1f8ac478fad2.jpg?v=1788182333&width=2000",
  "https://www.pothys.com/cdn/shop/files/WhatsApp_Image_2026-08-29_at_3.34.48_PM.jpg?v=1787998207&width=1600",
  "https://www.pothys.com/cdn/shop/files/Free_Shipping_banner.avif?v=1783578070&width=3500",
  "https://images.unsplash.com/photo-1594465919760-441fe5908ab0?w=1600",
];

const ROTATE_INTERVAL = 4500;

export function PromoBannerCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % images.length);
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full aspect-[4/3] sm:aspect-auto sm:h-[60vh] sm:min-h-[380px] sm:max-h-[560px] overflow-hidden">
      {images.map((src, idx) => (
        <img
          key={src}
          src={src}
          alt="Sudha Collections promotional banner"
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ease-in-out ${
            idx === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Small dot indicators, bottom-right, understated relative to the hero's */}
      <div className="absolute bottom-3 right-4 sm:bottom-4 sm:right-10 z-20 flex items-center gap-1.5">
        {images.map((src, idx) => (
          <span
            key={src}
            className={`h-1.5 rounded-full transition-all ${
              idx === active ? "w-5 bg-gold-300" : "w-1.5 bg-ivory-50/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}