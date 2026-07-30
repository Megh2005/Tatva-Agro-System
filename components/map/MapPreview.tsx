"use client";

import dynamic from "next/dynamic";
import React from "react";
import { Loader2, MapPin } from "lucide-react";

interface MapPreviewProps {
  lat: number;
  lng: number;
  zoom?: number;
  markerTitle?: string;
  className?: string;
  height?: string;
  interactive?: boolean;
  mapType?: "roadmap" | "satellite";
}

const DynamicMapInner = dynamic(
  () => import("./MapPreviewInner"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-45 bg-slate-100 flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        <span className="text-xs font-semibold text-slate-500">Loading map preview...</span>
      </div>
    ),
  }
);

export default function MapPreview(props: MapPreviewProps) {
  if (typeof props.lat !== "number" || typeof props.lng !== "number" || isNaN(props.lat) || isNaN(props.lng)) {
    return (
      <div className="w-full h-full min-h-45 bg-slate-50 flex flex-col items-center justify-center text-slate-400 rounded-xl border border-slate-200">
        <MapPin className="w-6 h-6 mb-1" />
        <span className="text-xs font-bold">No valid location coordinates</span>
      </div>
    );
  }

  return <DynamicMapInner {...props} />;
}
