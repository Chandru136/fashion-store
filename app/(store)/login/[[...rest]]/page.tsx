"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser } from "@/app/actions/auth.actions";
import { Lock, Mail, ArrowRight } from "lucide-react";

interface FieldErrors {
  email?: string;
  password?: string;
}

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Email address is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Enter a valid email address";
  return undefined;
}

function validatePassword(password: string): string | undefined {
  if (!password) return "Password is required";
  return undefined;
}

function LoginPageInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) setServerError(oauthError);
  }, [searchParams]);

  const validateAll = (): FieldErrors => ({
    email: validateEmail(email),
    password: validatePassword(password),
  });

  const handleBlur = (field: keyof FieldErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateAll());
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const fieldErrors = validateAll();
    setErrors(fieldErrors);
    setTouched({ email: true, password: true });

    const hasErrors = Object.values(fieldErrors).some(Boolean);
    if (hasErrors) return;

    setIsLoading(true);
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
      setServerError(res.error || "Login failed");
    }
  };

  const showError = (field: keyof FieldErrors) => touched[field] && errors[field];

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="p-8 bg-white rounded-xl border gold-border shadow-xl space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 wine-gradient-bg rounded-full flex items-center justify-center mx-auto border gold-border text-gold-300 font-bold text-xl font-brand-title shadow">
            AH
          </div>
          <h1 className="font-serif text-2xl font-bold text-wine-900 pt-2">Welcome Back</h1>
          <p className="text-xs text-stone-500">Sign in to your Aarna Heritage account</p>
        </div>

        {serverError && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded border border-red-200">
            {serverError}
          </div>
        )}

        <form onSubmit={handleLogin} noValidate className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-stone-700 block mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="customer@example.com"
                className={`w-full pl-9 pr-3 py-2.5 border rounded focus:outline-none ${
                  showError("email") ? "border-red-400 focus:border-red-500" : "border-stone-300 focus:border-gold-500"
                }`}
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
            {showError("email") && <p className="text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                placeholder="••••••••"
                className={`w-full pl-9 pr-3 py-2.5 border rounded focus:outline-none ${
                  showError("password") ? "border-red-400 focus:border-red-500" : "border-stone-300 focus:border-gold-500"
                }`}
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
            {showError("password") && <p className="text-red-600 mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 wine-gradient-bg text-gold-300 font-bold text-xs uppercase tracking-wider rounded gold-border shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? "Authenticating..." : "Sign In"} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-stone-200"></div>
          <span className="mx-3 text-[10px] font-bold text-stone-400 uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-stone-200"></div>
        </div>

        <a
          href="/api/auth/google"
          className="w-full py-2.5 border border-stone-300 rounded flex items-center justify-center gap-2 text-xs font-bold text-stone-700 hover:border-gold-500 hover:bg-ivory-50 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </a>

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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
