"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  desktopImage: string;
  mobileImage?: string | null;
  buttonText?: string | null;
  buttonUrl?: string | null;
}

export function HeroCarousel({ banners = [] }: { banners: Banner[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (banners.length === 0 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length, isPaused]);

  if (banners.length === 0) return null;

  const current = banners[currentIndex];

  return (
    <section
      className="relative h-[540px] sm:h-[500px] md:h-auto md:aspect-[21/9] md:min-h-[480px] bg-wine-900 overflow-hidden group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image Slide */}
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <img
            src={banner.desktopImage}
            alt={banner.title}
            className="w-full h-full object-cover object-center hidden md:block"
          />
          <img
            src={banner.mobileImage || banner.desktopImage}
            alt={banner.title}
            className="w-full h-full object-cover object-center md:hidden"
          />
          {/* Subtle Dark Vignette Overlay for Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-wine-900 via-wine-900/35 to-transparent md:bg-gradient-to-r md:from-wine-900/90 md:via-wine-900/50 md:to-transparent" />
        </div>
      ))}

      {/* Content Overlay */}
      <div className="relative z-20 max-w-7xl mx-auto h-full px-4 sm:px-6 md:px-12 flex flex-col justify-end md:justify-center text-ivory-50 pb-16 pt-12 md:py-12">
        <div className="max-w-xl space-y-3 md:space-y-4 animate-fade-in">
          <span className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-gold-300 bg-wine-800/80 border gold-border">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" /> Handcrafted Royal Heritage
          </span>
          <h1 className="font-serif text-[2rem] sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] gold-gradient-text">
            {current.title}
          </h1>
          {current.subtitle && (
            <p className="text-sm md:text-base text-ivory-200 font-light max-w-lg line-clamp-3 leading-relaxed">
              {current.subtitle}
            </p>
          )}
          <div className="pt-2">
            <Link
              href={current.buttonUrl || "/products"}
              className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-6 sm:px-8 py-3.5 wine-gradient-bg text-gold-300 font-semibold text-xs rounded uppercase tracking-widest gold-border shadow-xl hover:brightness-110 transition-all gold-border-glow"
            >
              {current.buttonText || "Explore Collection"}
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/30 backdrop-blur-md text-ivory-50 flex items-center justify-center hover:bg-gold-500 hover:text-wine-900 transition-all md:opacity-0 md:group-hover:opacity-100"
        aria-label="Previous Banner"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/30 backdrop-blur-md text-ivory-50 flex items-center justify-center hover:bg-gold-500 hover:text-wine-900 transition-all md:opacity-0 md:group-hover:opacity-100"
        aria-label="Next Banner"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Indicator Dots */}
      <div className="absolute bottom-5 md:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all ${
              idx === currentIndex ? "w-8 bg-gold-400" : "w-2 bg-white/40 hover:bg-white"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
