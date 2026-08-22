"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/app/actions/auth.actions";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin@12345");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const res = await loginUser({ email, password });
    setIsLoading(false);

    if (res.success && res.user?.role !== "CUSTOMER") {
      router.refresh();
      router.push("/admin");
    } else if (res.success) {
      setError("Access Denied: Customer accounts cannot access the Admin Portal.");
    } else {
      setError(res.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-900 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-6 border-2 gold-border">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 wine-gradient-bg rounded-full flex items-center justify-center mx-auto border-2 gold-border text-gold-300 font-bold text-2xl font-brand-title shadow-lg">
            SUDHA
          </div>
          <h1 className="font-serif text-2xl font-bold text-wine-900 pt-2">Admin Portal Authentication</h1>
          <p className="text-xs text-stone-500">Restricted access for Aarna Heritage administrators</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded border border-red-200">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-stone-700 block mb-1">Administrator Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded focus:outline-none focus:border-gold-500 font-mono text-xs"
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
                className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded focus:outline-none focus:border-gold-500 font-mono text-xs"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="p-3 bg-ivory-50 rounded border gold-border text-[11px] space-y-1">
            <p className="font-bold text-wine-900 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-gold-600" /> Development Demo Credentials:
            </p>
            <p className="font-mono text-stone-600">Email: <strong>admin@example.com</strong></p>
            <p className="font-mono text-stone-600">Password: <strong>Admin@12345</strong></p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 wine-gradient-bg text-gold-300 font-bold text-xs uppercase tracking-widest rounded gold-border shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? "Verifying Credentials..." : "Access Control Center"} <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
