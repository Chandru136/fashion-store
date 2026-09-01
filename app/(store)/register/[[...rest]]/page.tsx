"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "@/app/actions/auth.actions";
import { User, Mail, Lock, Phone, ArrowRight, Check, X } from "lucide-react";

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

function validateName(name: string): string | undefined {
  if (!name.trim()) return "Full name is required";
  if (name.trim().length < 2) return "Name must be at least 2 characters";
  return undefined;
}

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Email address is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Enter a valid email address";
  return undefined;
}

function validatePhone(phone: string): string | undefined {
  if (!phone) return undefined; // optional field
  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.length < 10) return "Phone number must be at least 10 digits";
  return undefined;
}

function validatePassword(password: string): string | undefined {
  if (!password) return "Password is required";
  if (password.length < 8) return "At least 8 characters";
  if (!/[a-z]/.test(password)) return "Include a lowercase letter";
  if (!/[A-Z]/.test(password)) return "Include an uppercase letter";
  if (!/[0-9]/.test(password)) return "Include a number";
  return undefined;
}

// Used for the live checklist under the password field, not for the error message itself
const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateAll = (): FieldErrors => ({
    name: validateName(name),
    email: validateEmail(email),
    phone: validatePhone(phone),
    password: validatePassword(password),
  });

  const handleBlur = (field: keyof FieldErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateAll());
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const fieldErrors = validateAll();
    setErrors(fieldErrors);
    setTouched({ name: true, email: true, phone: true, password: true });

    const hasErrors = Object.values(fieldErrors).some(Boolean);
    if (hasErrors) return;

    setIsLoading(true);
    const res = await registerUser({ name, email, phone, password });
    setIsLoading(false);

    if (res.success) {
      router.refresh();
      router.push("/profile");
    } else {
      setServerError(res.error || "Registration failed");
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
          <h1 className="font-serif text-2xl font-bold text-wine-900 pt-2">Join Aarna Heritage</h1>
          <p className="text-xs text-stone-500">Create an account for exclusive privileges & order tracking</p>
        </div>

        {serverError && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded border border-red-200">
            {serverError}
          </div>
        )}

        <form onSubmit={handleRegister} noValidate className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-stone-700 block mb-1">Full Name</label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => handleBlur("name")}
                placeholder="Priya Sharma"
                className={`w-full pl-9 pr-3 py-2.5 border rounded focus:outline-none ${
                  showError("name") ? "border-red-400 focus:border-red-500" : "border-stone-300 focus:border-gold-500"
                }`}
              />
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
            {showError("name") && <p className="text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="priya@example.com"
                className={`w-full pl-9 pr-3 py-2.5 border rounded focus:outline-none ${
                  showError("email") ? "border-red-400 focus:border-red-500" : "border-stone-300 focus:border-gold-500"
                }`}
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
            {showError("email") && <p className="text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Phone Number</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => handleBlur("phone")}
                placeholder="+91 9876543210"
                className={`w-full pl-9 pr-3 py-2.5 border rounded focus:outline-none ${
                  showError("phone") ? "border-red-400 focus:border-red-500" : "border-stone-300 focus:border-gold-500"
                }`}
              />
              <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
            {showError("phone") && <p className="text-red-600 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                placeholder="At least 8 characters"
                className={`w-full pl-9 pr-3 py-2.5 border rounded focus:outline-none ${
                  showError("password") ? "border-red-400 focus:border-red-500" : "border-stone-300 focus:border-gold-500"
                }`}
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>

            {/* Live checklist — appears once the user starts typing */}
            {password.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                {passwordRules.map((rule) => {
                  const passed = rule.test(password);
                  return (
                    <div key={rule.label} className={`flex items-center gap-1 ${passed ? "text-emerald-600" : "text-stone-400"}`}>
                      {passed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>{rule.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 wine-gradient-bg text-gold-300 font-bold text-xs uppercase tracking-wider rounded gold-border shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? "Creating Account..." : "Create Account"} <ArrowRight className="w-4 h-4" />
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
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-wine-900 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
