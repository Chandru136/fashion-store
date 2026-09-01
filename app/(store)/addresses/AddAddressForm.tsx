"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createAddress } from "@/app/actions/address.actions";
import { Plus, X } from "lucide-react";

type FormState = {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function validateForm(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (form.name.trim().length < 2) errors.name = "Name is required";
  if (form.phone.replace(/\D/g, "").length < 10) errors.phone = "Phone number is required";
  if (form.addressLine1.trim().length < 5) errors.addressLine1 = "Address Line 1 is required";
  if (form.city.trim().length < 2) errors.city = "City is required";
  if (form.state.trim().length < 2) errors.state = "State is required";
  if (form.pincode.trim().length < 6) errors.pincode = "Valid 6-digit pincode required";
  return errors;
}

const initialForm: FormState = {
  name: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

export default function AddAddressForm() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState<FormState>(initialForm);
  const router = useRouter();

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear that field's error as soon as the user edits it again
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clientErrors = validateForm(form);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await createAddress({ ...form, country: "India" });
      if (res.success) {
        setOpen(false);
        setForm(initialForm);
        setFieldErrors({});
        router.refresh();
      } else {
        setError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors as FieldErrors);
      }
    } catch {
      setError("Could not save address. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field: keyof FormState) =>
    `w-full px-3 py-2 border rounded focus:outline-none ${
      fieldErrors[field] ? "border-red-400 focus:border-red-500" : "border-stone-300 focus:border-gold-500"
    }`;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="p-6 bg-ivory-50 rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center gap-2 text-stone-500 hover:border-gold-500 hover:text-gold-600 transition-all min-h-[160px]"
      >
        <Plus className="w-6 h-6" />
        <span className="text-xs font-bold uppercase tracking-wider">Add New Address</span>
      </button>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl border gold-border shadow-md space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <h3 className="font-serif font-bold text-wine-900 text-sm">New Address</h3>
        <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-stone-700">
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && <div className="p-2 bg-red-50 text-red-700 font-bold rounded border border-red-200">{error}</div>}

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <div>
          <input
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={inputClass("name")}
          />
          {fieldErrors.name && <p className="text-red-600 mt-1">{fieldErrors.name}</p>}
        </div>

        <div>
          <input
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className={inputClass("phone")}
          />
          {fieldErrors.phone && <p className="text-red-600 mt-1">{fieldErrors.phone}</p>}
        </div>

        <div>
          <input
            placeholder="Address Line 1"
            value={form.addressLine1}
            onChange={(e) => handleChange("addressLine1", e.target.value)}
            className={inputClass("addressLine1")}
          />
          {fieldErrors.addressLine1 && <p className="text-red-600 mt-1">{fieldErrors.addressLine1}</p>}
        </div>

        <input
          placeholder="Address Line 2 (optional)"
          value={form.addressLine2}
          onChange={(e) => handleChange("addressLine2", e.target.value)}
          className={inputClass("addressLine2")}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              placeholder="City"
              value={form.city}
              onChange={(e) => handleChange("city", e.target.value)}
              className={inputClass("city")}
            />
            {fieldErrors.city && <p className="text-red-600 mt-1">{fieldErrors.city}</p>}
          </div>
          <div>
            <input
              placeholder="State"
              value={form.state}
              onChange={(e) => handleChange("state", e.target.value)}
              className={inputClass("state")}
            />
            {fieldErrors.state && <p className="text-red-600 mt-1">{fieldErrors.state}</p>}
          </div>
        </div>

        <div>
          <input
            placeholder="Pincode"
            value={form.pincode}
            onChange={(e) => handleChange("pincode", e.target.value)}
            className={inputClass("pincode")}
          />
          {fieldErrors.pincode && <p className="text-red-600 mt-1">{fieldErrors.pincode}</p>}
        </div>

        <label className="flex items-center gap-2 text-stone-600">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => handleChange("isDefault", e.target.checked)}
          />
          Set as default address
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 wine-gradient-bg text-gold-300 font-bold uppercase tracking-wider rounded gold-border shadow hover:brightness-110 disabled:opacity-60"
        >
          {isLoading ? "Saving..." : "Save Address"}
        </button>
      </form>
    </div>
  );
}