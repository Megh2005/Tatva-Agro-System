"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { fixLeafletIcon } from "./leaflet-config";

interface MapPreviewInnerProps {
  lat: number;
  lng: number;
  zoom?: number;
  markerTitle?: string;
  className?: string;
  height?: string;
  interactive?: boolean;
  mapType?: "roadmap" | "satellite";
}

function MapFlyTo({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    // Invalidate map size on load to ensure proper rendering inside flex/grid containers
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    const safeZoom = Math.min(Math.max(zoom, 1), 18);
    map.flyTo([lat, lng], safeZoom, { duration: 1.5 });
  }, [lat, lng, zoom, map]);
  return null;
}

export default function MapPreviewInner({
  lat,
  lng,
  zoom = 16,
  markerTitle,
  className = "",
  height = "100%",
  interactive = true,
  mapType = "roadmap",
}: MapPreviewInnerProps) {
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  const safeZoom = Math.min(Math.max(zoom, 1), 18);
  const isSatellite = mapType === "satellite";

  // Standard OpenStreetMap for roadmap, Google Hybrid Satellite for high-res satellite view
  const tileUrl = isSatellite
    ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const attribution = isSatellite
    ? "&copy; Google Maps Satellite"
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  return (
    <div className={`relative w-full h-full min-h-50 ${className}`} style={{ height }}>
      <MapContainer
        center={[lat, lng]}
        zoom={safeZoom}
        maxZoom={19}
        minZoom={2}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        doubleClickZoom={interactive}
        className="w-full h-full rounded-inherit z-0"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer attribution={attribution} url={tileUrl} maxNativeZoom={19} maxZoom={20} />
        <Marker position={[lat, lng]}>
          {markerTitle && <Popup>{markerTitle}</Popup>}
        </Marker>
        <MapFlyTo lat={lat} lng={lng} zoom={safeZoom} />
      </MapContainer>
    </div>
  );
}
