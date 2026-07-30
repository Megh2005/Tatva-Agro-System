"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import BackgroundPattern from "@/components/BackgroundPattern";
import { Loader2 } from "lucide-react";
import { indianStatesAndCities } from "@/lib/states";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MapPreview from "@/components/map/MapPreview";
import AddressSearch from "@/components/map/AddressSearch";

const defaultCenter = {
  lat: 20.5937, // Default to India
  lng: 78.9629,
};

export default function CreatePlotPage() {
  const router = useRouter();
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/auth");
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    state: "",
    city: "",
    pincode: "",
    area: "",
  });

  const [landmarkData, setLandmarkData] = useState<{
    name: string;
    address: string;
    lat: number;
    lng: number;
    pincode?: string;
  } | null>(null);

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreatePlot = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!landmarkData) {
      toast.error("Please search and select a landmark on the map.");
      return;
    }

    if (!formData.name) {
      toast.error("Please enter a plot name.");
      return;
    }

    if (formData.name.length < 5 || formData.name.length > 12) {
      toast.error("Plot name must be between 5 and 12 characters.");
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(formData.name)) {
      toast.error("Plot name must be alphanumeric without spaces or special characters.");
      return;
    }

    if (
      !formData.state ||
      !formData.city ||
      !formData.pincode ||
      !formData.area
    ) {
      toast.error("Please fill in all the details.");
      return;
    }

    if (landmarkData.pincode && landmarkData.pincode !== formData.pincode) {
      toast.error(
        `The landmark's pincode is ${landmarkData.pincode}, but you entered ${formData.pincode}. They must match!`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/plots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          area: Number(formData.area),
          landmark: landmarkData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create plot");
      }

      toast.success("Plot created successfully!");
      router.push("/plots");
    } catch (error) {
      console.error(error);
      toast.error("Error creating plot. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-10 px-4 flex justify-center">
      <BackgroundPattern />
      <div className="w-full max-w-[90vw] z-10 relative space-y-6">
        <div className="text-center mb-10">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-800">
            Register a{" "}
            <span className="bg-linear-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              Plot
            </span>
          </h1>
          <p className="mx-auto max-w-[65vw] text-lg sm:text-xl text-slate-500 font-medium tracking-tight mt-2">
            Register your land by providing details and selecting a landmark on
            the{" "}
            <span className="font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              map
            </span>
            .
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Plot Form Card */}
          <Card className="shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white/95 backdrop-blur-md h-fit overflow-hidden border-2 border-black">
            <div className="bg-linear-to-r from-amber-500 to-orange-600 h-1.5 w-full"></div>
            <CardHeader className="pb-6 border-b border-slate-100">
              <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                Plot Details
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium">
                Enter the location and size of your agricultural plot.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleCreatePlot} className="space-y-5">
                {/* Row 1: Plot Name + Land Area */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">
                      Plot Name
                    </Label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="E.g., FieldAlpha"
                      className="border-2 border-black focus-visible:ring-4 focus-visible:ring-orange-500/10 focus-visible:border-orange-500 rounded-xl bg-slate-50/85 hover:bg-slate-50/95 h-11 text-sm font-medium text-slate-800 transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      required
                    />
                    <p className="text-[10px] text-slate-400 font-bold">
                      * 5–12 alphanumeric chars, no spaces.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">
                      Land Area (Acres)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      name="area"
                      value={formData.area}
                      onChange={handleChange}
                      placeholder="E.g., 5.5"
                      className="border-2 border-black focus-visible:ring-4 focus-visible:ring-orange-500/10 focus-visible:border-orange-500 rounded-xl bg-slate-50/85 hover:bg-slate-50/95 h-11 text-sm font-medium text-slate-800 transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      required
                    />
                  </div>
                </div>

                {/* Row 2: State + City */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">
                      State
                    </Label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          state: e.target.value,
                          city: "",
                        });
                      }}
                      className="w-full border-2 border-black rounded-xl p-3 bg-slate-50/85 outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 text-sm font-medium text-slate-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      required
                    >
                      <option value="" disabled>Select State</option>
                      {Object.keys(indianStatesAndCities)
                        .sort()
                        .map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-sm">
                      City / District
                    </Label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      disabled={!formData.state}
                      className="w-full border-2 border-black rounded-xl p-3 bg-slate-50/85 disabled:bg-slate-100/50 disabled:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all duration-200 text-sm font-medium text-slate-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      required
                    >
                      <option value="" disabled>Select City</option>
                      {formData.state &&
                        indianStatesAndCities[formData.state]
                          ?.sort()
                          .map((city) => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                    </select>
                  </div>
                </div>

                {/* Row 3: Pincode */}
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">
                    Pincode
                  </Label>
                  <Input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="E.g., 411001"
                    className="border-2 border-black focus-visible:ring-4 focus-visible:ring-orange-500/10 focus-visible:border-orange-500 rounded-xl bg-slate-50/85 hover:bg-slate-50/95 h-11 text-sm font-medium text-slate-800 transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    required
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !landmarkData}
                    className="w-full rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 px-4 py-3.5 font-bold text-white hover:shadow-lg hover:shadow-emerald-500/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-250 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    {isSubmitting ? "Saving Plot..." : "Create Plot"}
                  </button>
                  {!landmarkData && (
                    <p className="text-xs text-rose-500 font-bold mt-3 text-center">
                      * Please select a landmark on the map first.
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Landmark Search & Map Card */}
          <Card className="shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white/95 backdrop-blur-md overflow-hidden flex flex-col h-full min-h-125 border-2 border-black">
            <div className="p-5 bg-white border-b border-slate-100">
              <Label className="text-slate-700 font-semibold mb-2 block text-sm">
                Search Landmark
              </Label>
              <AddressSearch
                onAddressSelect={(address, lat, lng, placeName, pincode, details) => {
                  setMapCenter({ lat, lng });
                  setLandmarkData({
                    name: placeName || address,
                    address: address,
                    lat,
                    lng,
                    pincode,
                  });

                  setFormData((prev) => {
                    let matchedState = prev.state;
                    let matchedCity = prev.city;
                    let matchedPincode = prev.pincode;

                    const availableStates = Object.keys(indianStatesAndCities);
                    const stateCandidate = details?.state || "";

                    let foundState = availableStates.find(
                      (s) => s.toLowerCase() === stateCandidate.toLowerCase()
                    );
                    if (!foundState) {
                      foundState = availableStates.find(
                        (s) =>
                          (stateCandidate && stateCandidate.toLowerCase().includes(s.toLowerCase())) ||
                          address.toLowerCase().includes(s.toLowerCase())
                      );
                    }

                    if (foundState) {
                      matchedState = foundState;

                      const cityCandidate = details?.city || "";
                      const citiesInState = indianStatesAndCities[foundState] || [];
                      let foundCity = citiesInState.find(
                        (c) => c.toLowerCase() === cityCandidate.toLowerCase()
                      );
                      if (!foundCity) {
                        foundCity = citiesInState.find(
                          (c) =>
                            (cityCandidate && cityCandidate.toLowerCase().includes(c.toLowerCase())) ||
                            address.toLowerCase().includes(c.toLowerCase())
                        );
                      }

                      if (foundCity) {
                        matchedCity = foundCity;
                      } else if (prev.state !== foundState) {
                        matchedCity = "";
                      }
                    }

                    const pinCandidate = pincode || details?.pincode;
                    if (pinCandidate) {
                      const cleanPin = pinCandidate.replace(/\D/g, "").slice(0, 6);
                      if (cleanPin) {
                        matchedPincode = cleanPin;
                      }
                    }

                    return {
                      ...prev,
                      state: matchedState,
                      city: matchedCity,
                      pincode: matchedPincode,
                    };
                  });

                  toast.info("State, city, and pincode automatically detected!");
                }}
                placeholder="Search for a landmark establishment..."
              />
            </div>
            <div className="grow p-4 relative bg-white min-h-100">
              <MapPreview
                lat={landmarkData ? landmarkData.lat : mapCenter.lat}
                lng={landmarkData ? landmarkData.lng : mapCenter.lng}
                zoom={landmarkData ? 16 : 5}
                markerTitle={landmarkData?.name || "Selected Location"}
                height="400px"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
