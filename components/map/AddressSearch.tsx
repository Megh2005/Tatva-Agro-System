"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2, MapPin, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface AddressSearchResult {
  display_name: string;
  lat: number;
  lng: number;
  placeName: string;
  pincode?: string;
  addressDetails?: {
    state?: string;
    city?: string;
    pincode?: string;
    road?: string;
    suburb?: string;
  };
}

interface AddressSearchProps {
  onAddressSelect: (
    address: string,
    lat: number,
    lng: number,
    placeName: string,
    pincode?: string,
    details?: {
      state?: string;
      city?: string;
      pincode?: string;
    },
  ) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
}

// In-memory cache for search queries
const searchCache = new Map<string, AddressSearchResult[]>();

export default function AddressSearch({
  onAddressSelect,
  placeholder = "Search for a landmark or establishment...",
  className = "",
  initialValue = "",
}: AddressSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<AddressSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchSearchResults = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSuggestions([]);
      setShowDropdown(false);
      setLoading(false);
      return;
    }

    if (searchCache.has(trimmed.toLowerCase())) {
      setSuggestions(searchCache.get(trimmed.toLowerCase()) || []);
      setShowDropdown(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Primary: Nominatim API with address details
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          trimmed,
        )}&limit=6&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en-US,en;q=0.9",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch address suggestions");
      }

      const data = await response.json();

      const mappedResults: AddressSearchResult[] = data.map((item: any) => {
        const addr = item.address || {};
        const placeName =
          item.name ||
          addr.shop ||
          addr.amenity ||
          addr.building ||
          addr.tourism ||
          addr.office ||
          addr.leisure ||
          addr.road ||
          item.display_name.split(",")[0] ||
          "Landmark";

        const pincode = addr.postcode || undefined;
        const city = addr.city || addr.town || addr.village || addr.county || addr.state_district;
        const state = addr.state;

        return {
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          placeName: placeName,
          pincode: pincode,
          addressDetails: {
            state,
            city,
            pincode,
            road: addr.road,
            suburb: addr.suburb,
          },
        };
      });

      searchCache.set(trimmed.toLowerCase(), mappedResults);
      setSuggestions(mappedResults);
      setShowDropdown(true);
      setHighlightedIndex(-1);
    } catch (err) {
      console.error("Address search error:", err);
      setError("Unable to search address. Please try again.");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setHighlightedIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      fetchSearchResults(val);
    }, 350);
  };

  const handleSelect = (result: AddressSearchResult) => {
    setQuery(result.display_name);
    setShowDropdown(false);
    onAddressSelect(
      result.display_name,
      result.lat,
      result.lng,
      result.placeName,
      result.pincode,
      result.addressDetails,
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          className="w-full pl-11 pr-10 bg-slate-50/80 border-2 border-black focus-visible:ring-4 focus-visible:ring-orange-500/10 focus-visible:border-orange-500 rounded-xl h-11 text-sm font-medium text-slate-800 transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        />
        {loading && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-orange-500" />
        )}
      </div>

      {/* Error Message */}
      {error && showDropdown && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border-2 border-black bg-rose-50 p-3 text-rose-700 text-xs font-semibold flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Autocomplete Suggestions Dropdown */}
      {showDropdown && !loading && suggestions.length > 0 && (
        <ul
          className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] divide-y divide-slate-100"
          role="listbox"
        >
          {suggestions.map((item, index) => {
            const isHighlighted = index === highlightedIndex;
            return (
              <li
                key={`${item.lat}-${item.lng}-${index}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlightedIndex(index)}
                role="option"
                aria-selected={isHighlighted}
                className={`cursor-pointer px-4 py-3 transition-colors flex items-start gap-3 ${
                  isHighlighted ? "bg-orange-50/80" : "hover:bg-slate-50"
                }`}
              >
                <MapPin className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {item.placeName}
                  </p>
                  <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
                    {item.display_name}
                  </p>
                  {item.pincode && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                      Pincode: {item.pincode}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* No Results Message */}
      {showDropdown && !loading && query.trim() && suggestions.length === 0 && !error && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border-2 border-black bg-white p-4 text-center text-sm font-medium text-slate-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          No location results found for &quot;{query}&quot;. Try a different search term.
        </div>
      )}
    </div>
  );
}
