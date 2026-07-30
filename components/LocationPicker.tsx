"use client";

import dynamic from "next/dynamic";
import React from "react";
import { Loader2 } from "lucide-react";
import { LocationPickerProps } from "./LocationPickerInner";

const LocationPickerDynamic = dynamic(
  () => import("./LocationPickerInner"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-100 bg-slate-100 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="text-sm font-bold text-slate-600">Loading Map...</span>
      </div>
    ),
  }
);

export default function LocationPicker(props: LocationPickerProps) {
  return <LocationPickerDynamic {...props} />;
}
