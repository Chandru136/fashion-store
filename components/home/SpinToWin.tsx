"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Gift, RotateCw, X } from "lucide-react";

const prizes = [
  { label: "10% off", code: "SUDHA10", detail: "on orders above ₹2,000" },
  { label: "₹500 off", code: "FESTIVE500", detail: "on orders above ₹4,999" },
  { label: "15% off", code: "ROYALSILK15", detail: "on silk orders above ₹10,000" },
  { label: "₹100 off", code: "WELCOME100", detail: "on orders above ₹999" },
];

export function SpinToWin() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prize, setPrize] = useState<(typeof prizes)[number] | null>(null);

  useEffect(() => {
    if (!window.localStorage.getItem("sudha-collections-spin-seen")) setIsOpen(true);
  }, []);

  const close = () => {
    window.localStorage.setItem("sudha-collections-spin-seen", "true");
    setIsOpen(false);
  };

  const spin = () => {
    if (isSpinning || prize) return;
    setIsSpinning(true);
    window.setTimeout(() => {
      setPrize(prizes[Math.floor(Math.random() * prizes.length)]);
      setIsSpinning(false);
    }, 2600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-wine-900/70 p-3 sm:items-center sm:p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="spin-title">
      <div className="relative my-auto grid w-full max-w-3xl overflow-hidden rounded-2xl bg-ivory-50 shadow-2xl md:grid-cols-[1.05fr_0.95fr]">
        <button onClick={close} className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-wine-900 shadow-sm transition hover:bg-gold-400" aria-label="Close offer"><X className="h-4 w-4" /></button>
        <div className="relative flex min-h-[230px] items-center justify-center overflow-hidden wine-gradient-bg p-5 sm:min-h-[330px] sm:p-8">
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_center,_#f3e5ab_1px,_transparent_1px)] [background-size:14px_14px]" />
          <div className="absolute top-1/2 z-20 h-0 w-0 -translate-y-1/2 border-y-[14px] border-y-transparent border-r-[26px] border-r-gold-300" />
          <button onClick={spin} disabled={isSpinning || Boolean(prize)} className={`relative z-10 grid h-44 w-44 place-items-center rounded-full border-[8px] border-ivory-50 shadow-2xl transition-transform duration-[2600ms] sm:h-56 sm:w-56 sm:border-[10px] ${isSpinning ? "rotate-[1080deg]" : ""} ${prize ? "cursor-default" : "hover:scale-105"}`} style={{ background: "conic-gradient(#d4af37 0deg 45deg, #6b1d2f 45deg 90deg, #f3e5ab 90deg 135deg, #4a0e17 135deg 180deg, #d4af37 180deg 225deg, #6b1d2f 225deg 270deg, #f3e5ab 270deg 315deg, #4a0e17 315deg)" }} aria-label="Spin to win">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-ivory-50 text-center font-serif text-base font-bold leading-tight text-wine-900 shadow-lg sm:h-24 sm:w-24 sm:text-lg">{isSpinning ? <RotateCw className="h-7 w-7 animate-spin text-gold-600" /> : prize ? <Check className="h-7 w-7 text-gold-600" /> : "SPIN"}</span>
          </button>
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-8 text-center md:text-left">
          {prize ? <><span className="mx-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-gold-300 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-wine-900 md:mx-0"><Gift className="h-3.5 w-3.5" /> Your offer</span><h2 id="spin-title" className="mt-4 font-serif text-3xl font-bold text-wine-900">You&apos;ve won {prize.label}</h2><p className="mt-2 text-sm text-stone-600">Use code <strong className="text-wine-900">{prize.code}</strong> {prize.detail}.</p><Link href="/products" onClick={close} className="mt-6 inline-flex w-full items-center justify-center rounded bg-wine-800 px-5 py-3 text-xs font-bold uppercase tracking-wider text-gold-300 transition hover:bg-wine-900">Start shopping</Link></> : <><p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gold-600">A welcome from Sudha Collections</p><h2 id="spin-title" className="mt-2 font-serif text-3xl font-bold text-wine-900">Spin for a welcome gift</h2><p className="mt-3 text-sm leading-6 text-stone-600">Your first visit deserves something special. Spin once to reveal a genuine store offer.</p><button onClick={spin} disabled={isSpinning} className="mt-6 inline-flex items-center justify-center gap-2 rounded bg-wine-800 px-5 py-3 text-xs font-bold uppercase tracking-wider text-gold-300 transition hover:bg-wine-900 disabled:cursor-wait"><Gift className="h-4 w-4" /> {isSpinning ? "Finding your gift..." : "Spin the wheel"}</button><button onClick={close} className="mt-4 text-xs font-semibold text-stone-500 underline underline-offset-4 hover:text-wine-800">No thanks, I&apos;ll browse first</button></>}
        </div>
      </div>
    </div>
  );
}
