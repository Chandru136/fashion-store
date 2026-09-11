import React from "react";
import { SudhaBrandLoader } from "@/components/common/Loader";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-ivory-100 flex items-center justify-center">
      <SudhaBrandLoader
        message="Loading Sudha Collections..."
        subMessage="Timeless Indian Heritage & Sarees"
      />
    </div>
  );
}
