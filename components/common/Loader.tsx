"use client";

import React from "react";

export type LoaderSize = "xs" | "sm" | "md" | "lg" | "xl";
export type LoaderColor = "gold" | "wine" | "white" | "stone";

interface LoaderProps {
  size?: LoaderSize;
  color?: LoaderColor;
  className?: string;
  label?: string;
}

const sizeClasses: Record<LoaderSize, { dim: string; stroke: number }> = {
  xs: { dim: "w-3.5 h-3.5", stroke: 3 },
  sm: { dim: "w-4 h-4", stroke: 3 },
  md: { dim: "w-6 h-6", stroke: 2.5 },
  lg: { dim: "w-10 h-10", stroke: 2 },
  xl: { dim: "w-14 h-14", stroke: 2 },
};

const colorConfig: Record<LoaderColor, { track: string; head: string }> = {
  gold: {
    track: "rgba(199, 163, 84, 0.25)",
    head: "var(--gold-500)",
  },
  wine: {
    track: "rgba(7, 61, 62, 0.2)",
    head: "var(--wine-800)",
  },
  white: {
    track: "rgba(255, 255, 255, 0.25)",
    head: "var(--ivory-50)",
  },
  stone: {
    track: "rgba(120, 113, 108, 0.2)",
    head: "var(--muted-text)",
  },
};

/**
 * High-performance luxury SVG spinner with dual-tone ring track
 */
export function Loader({
  size = "md",
  color = "gold",
  className = "",
  label = "Loading...",
}: LoaderProps) {
  const { dim, stroke } = sizeClasses[size];
  const { track, head } = colorConfig[color];

  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
    >
      <svg
        className={`${dim} luxury-spinner`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="9.5"
          stroke={track}
          strokeWidth={stroke}
        />
        <path
          d="M12 2.5C17.2467 2.5 21.5 6.75329 21.5 12"
          stroke={head}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * Micro-interaction button loader with optional status text
 */
export function ButtonLoader({
  text,
  size = "sm",
  color = "white",
  className = "",
}: {
  text?: string;
  size?: LoaderSize;
  color?: LoaderColor;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Loader size={size} color={color} />
      {text && <span>{text}</span>}
    </span>
  );
}

/**
 * Sudha Collections branded full-page / section suspense loader
 */
export function SudhaBrandLoader({
  message = "Weaving your timeless experience...",
  subMessage = "Sudha Collections Handlooms & Silk",
}: {
  message?: string;
  subMessage?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-fade-in">
      <div className="relative flex items-center justify-center mb-6">
        {/* Radiating pulsating outer glow */}
        <div className="absolute w-24 h-24 rounded-full bg-gold-400/20 blur-xl animate-pulse" />
        
        {/* Outer orbital luxury spinner */}
        <div className="w-20 h-20 rounded-full border-2 border-gold-300/30 border-t-gold-500 border-r-gold-400 luxury-spinner shadow-lg" />

        {/* Center brand crest */}
        <div className="absolute w-12 h-12 wine-gradient-bg rounded-full flex items-center justify-center border gold-border shadow-md">
          <img src="/peacock-feather.svg" alt="" className="sc-brand-mark h-12 w-9 shrink-0" />
        </div>
      </div>

      <h3 className="font-serif text-lg md:text-xl font-bold text-wine-900 tracking-wide">
        {message}
      </h3>
      <p className="text-xs text-stone-500 mt-1 uppercase tracking-[0.25em]">
        {subMessage}
      </p>
    </div>
  );
}

/**
 * Backdrop overlay loader for heavy operations (e.g. order submission or payment initialization)
 */
export function LoaderOverlay({
  message = "Processing your request...",
}: {
  message?: string;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={message}
      className="fixed inset-0 z-[120] bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-ivory-50/95 rounded-2xl p-6 shadow-2xl border gold-border max-w-sm w-full flex flex-col items-center text-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-3 border-gold-200 border-t-wine-800 border-r-gold-500 luxury-spinner shadow" />
          <div className="absolute w-9 h-9 wine-gradient-bg rounded-full flex items-center justify-center border gold-border">
            <img src="/peacock-feather.svg" alt="" className="sc-brand-mark h-12 w-9 shrink-0" />
          </div>
        </div>
        <div>
          <p className="font-serif font-bold text-wine-900 text-sm">{message}</p>
          <p className="text-[11px] text-stone-500 mt-0.5">Please do not refresh the page</p>
        </div>
      </div>
    </div>
  );
}
