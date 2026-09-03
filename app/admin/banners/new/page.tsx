import React from "react";
import BannerForm from "../BannerForm";

export default function NewBannerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-wine-900">New Hero Banner</h1>
        <p className="text-sm text-stone-500 mt-1">Add a new banner to the homepage carousel.</p>
      </div>

      <BannerForm />
    </div>
  );
}