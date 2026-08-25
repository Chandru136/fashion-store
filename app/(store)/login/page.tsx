"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser } from "@/app/actions/auth.actions";
import { Lock, Mail, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const res = await loginUser({ email, password });
    setIsLoading(false);

    if (res.success) {
      router.refresh();
      if (res.user?.role !== "CUSTOMER") {
        router.push("/admin");
      } else {
        router.push("/profile");
      }
    } else {
      setError(res.error || "Login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="p-8 bg-white rounded-xl border gold-border shadow-xl space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 wine-gradient-bg rounded-full flex items-center justify-center mx-auto border gold-border text-gold-300 font-bold text-xl font-brand-title shadow">
            AH
          </div>
          <h1 className="font-serif text-2xl font-bold text-wine-900 pt-2">Welcome Back</h1>
          <p className="text-xs text-stone-500">Sign in to your Sudha Collections account</p>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded border border-red-200">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-stone-700 block mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded focus:outline-none focus:border-gold-500"
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded focus:outline-none focus:border-gold-500"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Quick Demo Login Preset Buttons */}
          <div className="p-3 bg-ivory-50 rounded border gold-border space-y-2">
            <p className="text-[10px] font-bold text-gold-600 uppercase tracking-wider">Demo Development Accounts</p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setEmail("customer@example.com");
                  setPassword("Customer@12345");
                }}
                className="py-1.5 px-2 bg-white border border-stone-300 rounded text-stone-800 font-semibold hover:border-gold-500"
              >
                👤 Customer Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@example.com");
                  setPassword("Admin@12345");
                }}
                className="py-1.5 px-2 wine-gradient-bg text-gold-300 rounded font-semibold gold-border"
              >
                👑 Admin Portal Demo
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 wine-gradient-bg text-gold-300 font-bold text-xs uppercase tracking-wider rounded gold-border shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? "Authenticating..." : "Sign In"} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-100">
          Don't have an account?{" "}
          <Link href="/register" className="font-bold text-wine-900 hover:underline">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
