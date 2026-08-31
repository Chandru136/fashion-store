"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Gift, RotateCw, Sparkles, X } from "lucide-react";

const prizes = [
  { label: "10% off", code: "SUDHA10", detail: "on orders above ₹2,000" },
  { label: "₹500 off", code: "FESTIVE500", detail: "on orders above ₹4,999" },
  { label: "15% off", code: "ROYALSILK15", detail: "on silk orders above ₹10,000" },
  { label: "₹100 off", code: "WELCOME100", detail: "on orders above ₹999" },
  { label: "Free shipping", code: "SHIPFREE", detail: "on every order above ₹1,499" },
  { label: "₹250 off", code: "ELEGANCE250", detail: "on festive picks above ₹2,999" },
  { label: "Gift wrap", code: "LUXEWRAP", detail: "on every premium order" },
  { label: "2x points", code: "DOUBLEJOY", detail: "on luxury silk collections" },
];

export function SpinToWin() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prize, setPrize] = useState<(typeof prizes)[number] | null>(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!window.localStorage.getItem("sudha-collections-spin-seen")) {
      setIsOpen(true);
    }
  }, []);

  const segmentColors = useMemo(
    () => ["#6b1d2f", "#d8b14a", "#4a0e17", "#f8e7b2", "#6b1d2f", "#d8b14a", "#4a0e17", "#f8e7b2"],
    []
  );

  const close = () => {
    window.localStorage.setItem("sudha-collections-spin-seen", "true");
    setIsOpen(false);
  };

  const spin = () => {
    if (isSpinning || prize) return;

    const pickedIndex = Math.floor(Math.random() * prizes.length);
    const pointerOffset = 22.5;
    const cycles = 8 * 360;
    const targetRotation = 360 - (pickedIndex * 45 + pointerOffset);
    const finalRotation = rotation + cycles + targetRotation;

    setIsSpinning(true);
    setRotation(finalRotation);

    window.setTimeout(() => {
      setPrize(prizes[pickedIndex]);
      setIsSpinning(false);
      window.localStorage.setItem("sudha-collections-spin-seen", "true");
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[#2b0f19]/80 p-3 sm:items-center sm:p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="spin-title">
      <div className="relative my-auto grid w-full max-w-4xl overflow-hidden rounded-[30px] border border-[#f5e4b4]/70 bg-[#fffaf5] shadow-[0_30px_100px_rgba(65,17,28,0.35)] md:grid-cols-[1.12fr_0.88fr]">
        <button
          onClick={close}
          className="absolute right-3 top-3 z-20 rounded-full bg-white/90 p-2 text-[#4a0e17] shadow-sm transition hover:bg-[#f5d98b]"
          aria-label="Close offer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_#851e37_0%,_#4a0e17_38%,_#220b13_100%)] p-5 sm:min-h-[360px] sm:p-8">
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_center,_rgba(255,255,255,0.2)_1.2px,_transparent_1.2px)] [background-size:16px_16px]" />
          <div className="absolute left-1/2 top-1/2 z-20 h-0 w-0 -translate-x-[2px] -translate-y-1/2 border-y-[18px] border-y-transparent border-r-[32px] border-r-[#f7d889] drop-shadow-[0_0_20px_rgba(247,216,137,0.85)]" />

          <div className="relative z-10 flex items-center justify-center">
            <div
              className="relative h-64 w-64 rounded-full border-[10px] border-[#f5d98b] shadow-[0_25px_60px_rgba(0,0,0,0.25)] transition-transform duration-[3000ms] ease-[cubic-bezier(0.18,0.89,0.32,1.18)] sm:h-[19rem] sm:w-[19rem]"
              style={{
                transform: `rotate(${rotation}deg)`,
                background: `conic-gradient(${segmentColors.map((color, index) => `${color} ${index * 45}deg ${(index + 1) * 45}deg`).join(", ")})`,
              }}
            >
              <div className="absolute inset-4 rounded-full border border-white/15" />
              <div className="absolute inset-9 rounded-full border border-white/20" />

              {prizes.map((item, index) => {
                const angle = index * 45;
                return (
                  <div
                    key={item.code}
                    className="absolute inset-0 flex items-start justify-center pt-5 text-center"
                    style={{ transform: `rotate(${angle}deg)` }}
                  >
                    <span className="w-[52%] text-[9px] font-bold uppercase tracking-[0.18em] text-[#fffaf5] drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] sm:text-[10px]">
                      {item.label}
                    </span>
                  </div>
                );
              })}

              <button
                onClick={spin}
                disabled={isSpinning || Boolean(prize)}
                className={`absolute left-1/2 top-1/2 z-20 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[6px] border-[#f7d889] bg-[#fffaf5] text-center font-serif text-base font-bold leading-tight text-[#4a0e17] shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition-all duration-300 sm:h-24 sm:w-24 sm:text-lg ${prize ? "cursor-default" : "hover:scale-105"}`}
                aria-label="Spin to win"
              >
                {isSpinning ? <RotateCw className="h-7 w-7 animate-spin text-[#7d1f32]" /> : prize ? <Check className="h-7 w-7 text-[#7d1f32]" /> : "SPIN"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-8 text-center md:text-left">
          {prize ? (
            <>
              <span className="mx-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-[#f5d98b] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-[#4a0e17] md:mx-0">
                <Gift className="h-3.5 w-3.5" /> Your offer
              </span>
              <h2 id="spin-title" className="mt-4 font-serif text-3xl font-bold text-[#2f0b14] sm:text-[2.2rem]">
                You&apos;ve won {prize.label}
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Use code <strong className="text-[#4a0e17]">{prize.code}</strong> {prize.detail}.
              </p>
              <Link
                href="/products"
                onClick={close}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#4a0e17] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#f5d98b] transition hover:bg-[#2f0b14]"
              >
                Start shopping
              </Link>
            </>
          ) : (
            <>
              <span className="inline-flex items-center justify-center gap-1.5 self-center rounded-full bg-[#f5d98b] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-[#4a0e17] md:self-start">
                <Sparkles className="h-3.5 w-3.5" /> Limited offer
              </span>
              <h2 id="spin-title" className="mt-3 font-serif text-3xl font-bold text-[#2f0b14] sm:text-[2.3rem]">
                Spin to unlock a festive surprise
              </h2>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                Enjoy a curated welcome reward on your first visit. Each spin reveals a luxury offer from our festival collection.
              </p>
              <button
                onClick={spin}
                disabled={isSpinning}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#4a0e17] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#f5d98b] transition hover:bg-[#2f0b14] disabled:cursor-wait disabled:opacity-80"
              >
                <Gift className="h-4 w-4" /> {isSpinning ? "Finding your offer..." : "Spin the wheel"}
              </button>
              <button
                onClick={close}
                className="mt-4 text-xs font-semibold text-stone-500 underline underline-offset-4 hover:text-[#4a0e17]"
              >
                No thanks, I&apos;ll browse first
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
