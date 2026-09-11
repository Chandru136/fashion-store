import React from "react";
import { SudhaBrandLoader } from "@/components/common/Loader";

export default function StorefrontLoading() {
  return (
    <div className="py-24 flex items-center justify-center">
      <SudhaBrandLoader
        message="Loading Collection..."
        subMessage="Sudha Collections Handlooms"
      />
    </div>
  );
}
