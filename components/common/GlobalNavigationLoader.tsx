"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader } from "./Loader";

function NavigationLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showBadge, setShowBadge] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const badgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentUrlRef = useRef<string>("");

  // Keep track of current URL
  useEffect(() => {
    currentUrlRef.current = `${pathname}${searchParams ? `?${searchParams.toString()}` : ""}`;
  }, [pathname, searchParams]);

  const startLoading = (msg = "Loading...") => {
    setLoadingMessage(msg);
    setIsLoading(true);
    setProgress(20);

    if (timerRef.current) clearInterval(timerRef.current);
    if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);

    // Increment progress in realistic steps
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          return prev;
        }
        const step = Math.max(1, (85 - prev) * 0.15);
        return Math.min(85, prev + step);
      });
    }, 150);

    // Show luxury brand pill badge if loading lasts more than 250ms
    badgeTimerRef.current = setTimeout(() => {
      setShowBadge(true);
    }, 250);
  };

  const finishLoading = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);

    setProgress(100);

    // Quick fade out
    setTimeout(() => {
      setIsLoading(false);
      setShowBadge(false);
      setTimeout(() => setProgress(0), 200);
    }, 250);
  };

  // Route change completion listener
  useEffect(() => {
    finishLoading();
  }, [pathname, searchParams]);

  // Global click event listener for internal links and actions
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      // Ignore special clicks (new tab, external, download, etc.)
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Check if it's an internal route
      const isInternal =
        href.startsWith("/") ||
        href.startsWith(window.location.origin) ||
        (!href.startsWith("http://") && !href.startsWith("https://") && !href.startsWith("mailto:") && !href.startsWith("tel:") && !href.startsWith("#"));

      if (!isInternal) return;

      // Handle hash-only clicks on current page
      if (href.startsWith("#")) return;

      // Extract destination URL without origin
      try {
        const url = new URL(anchor.href, window.location.href);
        const destination = `${url.pathname}${url.search}`;

        // Don't show loader if navigating to current exact page with hash
        if (destination === currentUrlRef.current && url.hash) return;
        
        // Start loader immediately on click
        startLoading("Loading Sudha Collections...");
      } catch {
        // Ignore malformed URLs
      }
    };

    // Listen to custom window events for manual triggers
    const handleCustomStart = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      startLoading(customEvent.detail?.message || "Loading...");
    };

    const handleCustomStop = () => {
      finishLoading();
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    window.addEventListener("app:loading:start", handleCustomStart);
    window.addEventListener("app:loading:stop", handleCustomStop);

    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
      window.removeEventListener("app:loading:start", handleCustomStart);
      window.removeEventListener("app:loading:stop", handleCustomStop);
      if (timerRef.current) clearInterval(timerRef.current);
      if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
    };
  }, []);

  if (!isLoading && progress === 0) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9999]">
      {/* Top Gold Foil Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gold-200/20 overflow-hidden">
        <div
          className="h-full gold-progress-bar transition-all duration-200 ease-out"
          style={{
            width: `${progress}%`,
            opacity: isLoading ? 1 : 0,
            transition: progress === 100 ? "width 0.15s ease-out, opacity 0.25s 0.1s ease-out" : "width 0.2s ease-out",
          }}
        />
      </div>

      {/* Luxury Floating Pill Badge */}
      {showBadge && (
        <div className="fixed top-5 right-5 pointer-events-auto bg-ivory-50/95 backdrop-blur-md rounded-full px-4 py-2 border gold-border shadow-xl flex items-center gap-2.5 animate-fade-in z-[9999]">
          <Loader size="sm" color="gold" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-wine-900 tracking-wide leading-tight">
              {loadingMessage}
            </span>
            <span className="text-[9px] text-gold-600 font-semibold uppercase tracking-wider">
              Sudha Collections
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function GlobalNavigationLoader() {
  return (
    <Suspense fallback={null}>
      <NavigationLoaderInner />
    </Suspense>
  );
}
