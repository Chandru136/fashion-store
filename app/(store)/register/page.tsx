"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "@/app/actions/auth.actions";
import { User, Mail, Lock, Phone, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const res = await registerUser({ name, email, phone, password });
    setIsLoading(false);

    if (res.success) {
      router.refresh();
      router.push("/profile");
    } else {
      setError(res.error || "Registration failed");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="p-8 bg-white rounded-xl border gold-border shadow-xl space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 wine-gradient-bg rounded-full flex items-center justify-center mx-auto border gold-border text-gold-300 font-bold text-xl font-brand-title shadow">
            AH
          </div>
          <h1 className="font-serif text-2xl font-bold text-wine-900 pt-2">Join Sudha Collections</h1>
          <p className="text-xs text-stone-500">Create an account for exclusive privileges & order tracking</p>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded border border-red-200">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-stone-700 block mb-1">Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Priya Sharma"
                className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded focus:outline-none focus:border-gold-500"
              />
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya@example.com"
                className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded focus:outline-none focus:border-gold-500"
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Phone Number</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded focus:outline-none focus:border-gold-500"
              />
              <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded focus:outline-none focus:border-gold-500"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 wine-gradient-bg text-gold-300 font-bold text-xs uppercase tracking-wider rounded gold-border shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? "Creating Account..." : "Create Account"} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-100">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-wine-900 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
