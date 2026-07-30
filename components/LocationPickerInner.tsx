"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { Loader2 } from "lucide-react";
import { fixLeafletIcon } from "@/components/map/leaflet-config";
import AddressSearch from "@/components/map/AddressSearch";

export interface LocationPickerProps {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address?: {
      state?: string;
      city?: string;
      pincode?: string;
      display_name?: string;
      establishment?: string;
    };
  }) => void;
  initialPosition?: { lat: number; lng: number } | null;
  readOnly?: boolean;
  height?: string;
}

const MapEvents = ({
  onLocationFound,
  readOnly,
}: {
  onLocationFound: (lat: number, lng: number) => void;
  readOnly?: boolean;
}) => {
  useMapEvents({
    click(e) {
      if (!readOnly) {
        onLocationFound(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

const MapFlyTo = ({
  coords,
}: {
  coords: { lat: number; lng: number } | null;
}) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo([coords.lat, coords.lng], 16, { duration: 1.5 });
    }
  }, [coords, map]);
  return null;
};

export default function LocationPickerInner({
  onLocationSelect,
  initialPosition = null,
  readOnly = false,
  height = "400px",
}: LocationPickerProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    initialPosition,
  );
  const [addressLoading, setAddressLoading] = useState(false);
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    fixLeafletIcon();
  }, []);

  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
    }
  }, [initialPosition]);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setAddressLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en-US,en;q=0.9",
          },
        }
      );
      const data = await response.json();

      if (data && data.address) {
        const establishment =
          data.name ||
          data.address.shop ||
          data.address.amenity ||
          data.address.building ||
          data.address.tourism ||
          data.address.office ||
          data.address.craft ||
          data.address.leisure ||
          "";

        const addressInfo = {
          state: data.address.state,
          city:
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.county,
          pincode: data.address.postcode,
          display_name: data.display_name,
          establishment: establishment,
        };

        onLocationSelect({
          lat,
          lng,
          address: addressInfo,
        });
      } else {
        onLocationSelect({ lat, lng });
      }
    } catch (error) {
      console.error("Error fetching reverse geocode:", error);
      onLocationSelect({ lat, lng });
    } finally {
      setAddressLoading(false);
    }
  }, [onLocationSelect]);

  const handleLocationFound = useCallback((lat: number, lng: number) => {
    setPosition({ lat, lng });
    reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          handleLocationFound(lat, lng);
        }
      },
    }),
    [handleLocationFound],
  );

  const defaultCenter: [number, number] = position
    ? [position.lat, position.lng]
    : [20.5937, 78.9629]; // Default to India

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border-2 border-black z-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white"
      style={{ height }}
    >
      {/* Search Bar Overlay - Only show if not readOnly */}
      {!readOnly && (
        <div className="absolute top-4 left-4 right-4 z-1000">
          <AddressSearch
            onAddressSelect={(address, lat, lng, placeName, pincode) => {
              handleLocationFound(lat, lng);
            }}
            placeholder="Search for a location or establishment..."
          />
        </div>
      )}

      {/* Leaflet Map */}
      <MapContainer
        center={defaultCenter}
        zoom={position ? 16 : 5}
        className="w-full h-full"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {position && (
          <Marker
            position={[position.lat, position.lng]}
            draggable={!readOnly}
            ref={markerRef}
            eventHandlers={eventHandlers}
          />
        )}

        <MapEvents onLocationFound={handleLocationFound} readOnly={readOnly} />
        <MapFlyTo coords={position} />
      </MapContainer>

      {/* Loading Overlay */}
      {addressLoading && (
        <div className="absolute bottom-4 left-4 right-4 z-1000 bg-slate-900/90 text-white p-3 rounded-xl backdrop-blur-md flex items-center gap-3 border-2 border-black shadow-lg">
          <Loader2 className="w-4 h-4 animate-spin text-orange-500 shrink-0" />
          <span className="text-xs font-semibold">Resolving location details...</span>
        </div>
      )}
    </div>
  );
}
