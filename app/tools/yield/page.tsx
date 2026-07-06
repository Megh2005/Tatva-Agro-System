"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import BackgroundPattern from "@/components/BackgroundPattern";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import {
  Loader2,
  ArrowLeft,
  Sprout,
  Activity,
  Calculator,
  Target,
  BarChart4,
  MapPin,
  Bug,
  FlaskConical,
  Wheat,
  CheckCircle2,
  AlertCircle,
  Info,
  Droplets,
  ThermometerSun,
  X,
} from "lucide-react";
import { getCityPh, type CityPh } from "@/lib/soil-ph";
import { CROPS_CATALOGUE } from "@/lib/crops";

// ────────────────────────────────────────────────────────────────────────────
// Pest catalogue with pre-assigned risk levels
// ────────────────────────────────────────────────────────────────────────────
const PEST_CATALOGUE = [
  { name: "None", risk: 0.0, label: "None" },
  { name: "Brown Planthopper", risk: 0.75, label: "High" },
  { name: "White-backed Planthopper", risk: 0.65, label: "High" },
  { name: "Yellow Stem Borer", risk: 0.8, label: "Very High" },
  { name: "Rice Leaf Folder", risk: 0.55, label: "Moderate" },
  { name: "Rice Hispa", risk: 0.45, label: "Moderate" },
  { name: "Gall Midge", risk: 0.7, label: "High" },
  { name: "Rice Thrips", risk: 0.35, label: "Low" },
  { name: "Rice Bug (Paddy Bug)", risk: 0.5, label: "Moderate" },
  { name: "Whorl Maggot", risk: 0.4, label: "Low" },
  { name: "Rat (Rodent Damage)", risk: 0.85, label: "Very High" },
] as const;

const RISK_BADGE_STYLE: Record<string, string> = {
  None: "bg-slate-100 text-slate-600 border-slate-300",
  Low: "bg-sky-50 text-sky-800 border-sky-300",
  Moderate: "bg-amber-50 text-amber-800 border-amber-300",
  High: "bg-orange-50 text-orange-800 border-orange-300",
  "Very High": "bg-rose-50 text-rose-800 border-rose-300",
};

// ────────────────────────────────────────────────────────────────────────────

export default function YieldEstimationPage() {
  const [plots, setPlots] = useState<any[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string>("");
  const [isLoadingPlots, setIsLoadingPlots] = useState(true);

  // Farmer-editable
  const [rowSpacing, setRowSpacing] = useState("0.20");
  const [plantSpacing, setPlantSpacing] = useState("0.15");
  const [paddyType, setPaddyType] = useState("Rice (Paddy)");
  const [targetChoice, setTargetChoice] = useState<"estimated" | "predicted">(
    "predicted",
  );

  // Soil (missing from DB – farmer fills in)
  const [nitrogen, setNitrogen] = useState("80");
  const [phosphorus, setPhosphorus] = useState("40");
  const [potassium, setPotassium] = useState("40");
  const [ec, setEc] = useState("1000");
  const [ph, setPh] = useState("6.0");
  const [phInfo, setPhInfo] = useState<CityPh | null>(null);

  // Pest
  const [selectedPestIdx, setSelectedPestIdx] = useState(0);

  // Damage
  const [damageAreaSize, setDamageAreaSize] = useState("0");

  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showActionPlan, setShowActionPlan] = useState(false);

  useEffect(() => {
    fetchPlots();
  }, []);

  const fetchPlots = async () => {
    try {
      const res = await fetch("/api/plots");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPlots(data);
      if (data.length > 0) setSelectedPlotId(data[0]._id);
    } catch {
      toast.error("Failed to load your plots.");
    } finally {
      setIsLoadingPlots(false);
    }
  };

  const selectedPlot = plots.find((p) => p._id === selectedPlotId);
  const dbMoisture = selectedPlot?.soilData?.moisture;
  const dbTemperature = selectedPlot?.soilData?.temperature;
  const farmAreaM2 = (selectedPlot?.area ?? 0) * 4046.86;
  const dbLat = selectedPlot?.landmark?.lat ?? 0;
  const dbLng = selectedPlot?.landmark?.lng ?? 0;

  // Auto-update pH, NPK, and EC whenever selected plot changes
  useEffect(() => {
    if (selectedPlot?.city) {
      const info = getCityPh(selectedPlot.city, selectedPlot.state);
      setPhInfo(info);
      setPh(info.ph.toFixed(1));
      setNitrogen(info.n.toString());
      setPhosphorus(info.p.toString());
      setPotassium(info.k.toString());
      setEc(info.ec.toString());
    } else {
      setPhInfo(null);
    }
  }, [selectedPlotId]);

  // Synchronize damage area size based on selected pest risk level and total area
  useEffect(() => {
    if (selectedPlot) {
      const pest = PEST_CATALOGUE[selectedPestIdx];
      const area = (selectedPlot.area ?? 0) * 4046.86;
      const calculatedDamage = (pest?.risk ?? 0) * area;
      setDamageAreaSize(calculatedDamage.toFixed(1));
    } else {
      setDamageAreaSize("0");
    }
  }, [selectedPlotId, selectedPestIdx]);

  const selectedPest = PEST_CATALOGUE[selectedPestIdx];
  const handleCropChange = (cropName: string) => {
    setPaddyType(cropName);
    const crop = CROPS_CATALOGUE.find((c) => c.name === cropName);
    if (crop) {
      setRowSpacing(crop.defaultRowSpacing.toFixed(2));
      setPlantSpacing(crop.defaultPlantSpacing.toFixed(2));
      setNitrogen(crop.nitrogen.toString());
      setPhosphorus(crop.phosphorus.toString());
      setPotassium(crop.potassium.toString());
      setEc(Math.round((crop.minEc + crop.maxEc) / 2).toString());
    }
  };

  const generateDamagePolygon = (lat: number, lng: number, areaM2: number) => {
    if (!areaM2 || areaM2 <= 0) return [];
    const LAT_M = 111320;
    const LON_M = 111320 * Math.cos((lat * Math.PI) / 180);
    const h = Math.sqrt(areaM2) / 2;
    return [
      { lat: lat + h / LAT_M, lon: lng + h / LON_M },
      { lat: lat + h / LAT_M, lon: lng - h / LON_M },
      { lat: lat - h / LAT_M, lon: lng - h / LON_M },
      { lat: lat - h / LAT_M, lon: lng + h / LON_M },
    ];
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlot) {
      toast.error("Select a plot first.");
      return;
    }
    setIsCalculating(true);

    try {
      const dmgPoly = generateDamagePolygon(
        dbLat,
        dbLng,
        Number(damageAreaSize),
      );
      const payload = {
        farmAreaM2,
        rowSpacingM: Number(rowSpacing),
        plantSpacingM: Number(plantSpacing),
        paddyType,
        targetYieldChoice: targetChoice,
        soilSensor: {
          moisture: dbMoisture !== undefined ? dbMoisture * 100 : 30,
          temperature: dbTemperature ?? 25,
          ec: Number(ec),
          ph: Number(ph),
          nitrogen: Number(nitrogen),
          phosphorus: Number(phosphorus),
          potassium: Number(potassium),
        },
        soilInfo: { isFertile: true, fertilityScore: 0.8, issues: [] },
        pestInfo: {
          isPestAffected: selectedPest.risk > 0,
          pestRiskScore: selectedPest.risk,
          pestName: selectedPest.name,
          confidence: 1.0,
          pesticideName: "Recommended Treatment",
          acreDose: { ml: 100 },
          miniFarmDose: { ml: 25 },
        },
        damageAreas:
          dmgPoly.length > 0 ? [{ mode: "polygon", points: dmgPoly }] : [],
        groundElevationM: 0,
      };

      const res = await fetch("/api/yeild", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setResult(data);
      toast.success("Yield calculated successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCalculating(false);
    }
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24 pt-10 px-4 flex justify-center">
      <BackgroundPattern />

      <div className="w-full max-w-[90vw] z-10 relative">
        {/* ── HEADER ── */}
        <div className="text-center mb-10 relative">
          <div className="absolute left-0 top-0 hidden md:flex">
            <Link href="/">
              <button className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold bg-white border border-slate-200 text-slate-655 hover:bg-slate-50 hover:border-slate-355 hover:shadow-sm transition-all duration-200 cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> Home
              </button>
            </Link>
          </div>
          <div className="md:hidden mb-6 flex justify-start">
            <Link href="/">
              <button className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold bg-white border border-slate-200 text-slate-655 hover:bg-slate-50 hover:border-slate-355 hover:shadow-sm transition-all duration-200 cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            </Link>
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-800">
            Yield{" "}
            <span className="bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Predictor
            </span>
          </h1>
          <p className="mx-auto max-w-[65vw] text-lg sm:text-xl text-slate-500 font-medium tracking-tight mt-2">
            Estimate your harvest from{" "}
            <span className="font-bold bg-linear-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              real plot data
            </span>{" "}
            and field conditions.
          </p>
        </div>

        {/* ── MAIN GRID (Four Equal Columns) ── */}
        <form
          onSubmit={handleCalculate}
          className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start "
        >
          {/* ── COLUMN 1: Plot & Live Status ── */}
          <div className="space-y-5">
            <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white/95 overflow-hidden">
              <div className="bg-linear-to-r from-emerald-500 to-teal-600 h-1.5 w-full" />
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Select Plot
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {isLoadingPlots ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : plots.length === 0 ? (
                  <p className="text-sm text-rose-500 font-bold">
                    No plots found. Create one first.
                  </p>
                ) : (
                  <select
                    className="w-full border border-black rounded-xl p-3 bg-slate-50/85 outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 text-sm font-medium text-slate-800 h-[46px] cursor-pointer"
                    value={selectedPlotId}
                    onChange={(e) => {
                      setSelectedPlotId(e.target.value);
                      setResult(null);
                    }}
                  >
                    {plots.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.landmark.name} — {p.area} Ac
                      </option>
                    ))}
                  </select>
                )}

                <div className="h-px bg-slate-100" />

                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Activity className="w-3.5 h-3.5 text-slate-455" /> Live
                    Plot Status
                  </p>

                  {/* Farm area */}
                  <div className="bg-slate-50/50 border-2 border-black rounded-xl p-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors duration-200">
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200/50 shrink-0">
                      <Wheat className="h-4 w-4 text-slate-505" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Farm Area
                      </p>
                      <p className="text-sm font-extrabold text-slate-800">
                        {farmAreaM2.toFixed(1)} m²
                      </p>
                    </div>
                  </div>

                  {/* Moisture */}
                  <div
                    className={`bg-slate-50/50 border-2 rounded-xl p-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors duration-200 ${dbMoisture !== undefined ? "border-black" : "border-rose-500 bg-rose-50/20"}`}
                  >
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200/50 shrink-0">
                      <Droplets className="h-4 w-4 text-sky-600" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Soil Moisture
                      </p>
                      {dbMoisture !== undefined ? (
                        <p className="text-sm font-extrabold text-slate-800">
                          {(dbMoisture * 100).toFixed(0)}%
                        </p>
                      ) : (
                        <p className="text-xs font-bold text-rose-500">
                          No Data
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Temperature */}
                  <div
                    className={`bg-slate-50/50 border-2 rounded-xl p-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors duration-200 ${dbTemperature !== undefined ? "border-black" : "border-rose-500 bg-rose-50/20"}`}
                  >
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200/50 shrink-0">
                      <ThermometerSun className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Soil Temp
                      </p>
                      {dbTemperature !== undefined ? (
                        <p className="text-sm font-extrabold text-slate-800">
                          {dbTemperature}°C
                        </p>
                      ) : (
                        <p className="text-xs font-bold text-rose-500">
                          No Data
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── COLUMN 2: Agronomic Parameter Settings Form ── */}
          <div className="space-y-5">
            <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white/95 overflow-hidden">
              <div className="bg-linear-to-r from-amber-500 to-orange-600 h-1.5 w-full" />
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                  <Calculator className="w-4 h-4 text-orange-600" /> Agronomic
                  Inputs
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 font-semibold mt-1 leading-relaxed">
                  Refine crop, spacing, pest, and soil settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {/* ── Crop Configuration ── */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Sprout className="w-3.5 h-3.5 text-slate-450" /> Crop &
                      Spacing
                    </p>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">
                        Crop Type
                      </Label>
                      <select
                        className="w-full border border-black rounded-xl px-3 bg-slate-50/85 outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 text-sm font-medium text-slate-800 h-[42px] cursor-pointer"
                        value={paddyType}
                        onChange={(e) => handleCropChange(e.target.value)}
                      >
                        {CROPS_CATALOGUE.map((crop) => (
                          <option key={crop.id} value={crop.name}>
                            {crop.name} [{crop.category}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          label: "Row Spacing (m)",
                          val: rowSpacing,
                          set: setRowSpacing,
                        },
                        {
                          label: "Plant Spacing (m)",
                          val: plantSpacing,
                          set: setPlantSpacing,
                        },
                      ].map(({ label, val, set }) => (
                        <div key={label} className="space-y-1">
                          <Label className="text-xs font-semibold text-slate-700">
                            {label}
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            required
                            value={val}
                            onChange={(e) => set(e.target.value)}
                            className="border border-black focus-visible:ring-4 focus-visible:ring-orange-500/10 focus-visible:border-orange-500 rounded-xl bg-slate-50/85 h-[42px] text-sm font-medium text-slate-800 transition-all duration-200"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-slate-100" />

                  {/* ── Soil Chemistry ── */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <FlaskConical className="w-3.5 h-3.5 text-slate-450" />{" "}
                      Soil Nutrients & pH
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "N", val: nitrogen, set: setNitrogen },
                        { label: "P", val: phosphorus, set: setPhosphorus },
                        { label: "K", val: potassium, set: setPotassium },
                      ].map(({ label, val, set }) => (
                        <div key={label} className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase">
                            {label}
                          </Label>
                          <Input
                            type="number"
                            required
                            value={val}
                            onChange={(e) => set(e.target.value)}
                            className="border border-black focus-visible:ring-4 focus-visible:ring-orange-500/10 focus-visible:border-orange-500 rounded-xl bg-slate-50/85 h-[42px] text-sm font-medium text-slate-800 transition-all duration-200"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">
                          EC (µS/cm)
                        </Label>
                        <Input
                          type="number"
                          required
                          value={ec}
                          onChange={(e) => setEc(e.target.value)}
                          className="border border-black focus-visible:ring-4 focus-visible:ring-orange-500/10 focus-visible:border-orange-500 rounded-xl bg-slate-50/85 h-[42px] text-sm font-medium text-slate-800 transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                          <span>pH Level</span>
                          {phInfo && (
                            <span className="text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full shrink-0">
                              {phInfo.type}
                            </span>
                          )}
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          required
                          value={ph}
                          onChange={(e) => setPh(e.target.value)}
                          className="border border-black focus-visible:ring-4 focus-visible:ring-orange-500/10 focus-visible:border-orange-500 rounded-xl bg-slate-50/85 h-[42px] text-sm font-medium text-slate-850 transition-all duration-200"
                        />
                      </div>
                    </div>

                    {phInfo && (
                      <div className="flex items-start gap-1.5 mt-1 bg-sky-50/50 border-2 border-black p-2.5 rounded-xl">
                        <Info className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-sky-900 leading-snug font-medium">
                          {phInfo.note} Representative pH: {phInfo.ph}.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── COLUMN 3: Pest & Damage ── */}
          <div className="space-y-5">
            <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white/95 overflow-hidden">
              <div className="bg-linear-to-r from-blue-700 to-indigo-800 h-1.5 w-full" />
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                  <Bug className="w-4 h-4 text-indigo-650" /> Pest & Damage
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 font-semibold mt-1 leading-relaxed">
                  Assess pest risk and run yield simulations.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 ">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Detected Pest
                  </Label>
                  <select
                    className="w-full border border-black rounded-xl p-2.5 bg-slate-50/85 outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 text-sm font-medium text-slate-800 h-[42px] cursor-pointer"
                    value={selectedPestIdx}
                    onChange={(e) => setSelectedPestIdx(Number(e.target.value))}
                  >
                    {PEST_CATALOGUE.map((p, i) => (
                      <option key={p.name} value={i}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">
                      Damage (m²)
                    </Label>
                    <Input
                      type="number"
                      required
                      value={damageAreaSize}
                      onChange={(e) => setDamageAreaSize(e.target.value)}
                      className="border border-black focus-visible:ring-4 focus-visible:ring-orange-500/10 focus-visible:border-orange-500 rounded-xl bg-slate-50/85 h-[42px] text-sm font-medium text-slate-800 transition-all duration-200"
                    />
                  </div>

                  <div className="pt-5">
                    {selectedPest.risk > 0 ? (
                      <div
                        className={`flex items-center justify-between rounded-xl border border-black px-3 py-1.5 h-[42px] ${RISK_BADGE_STYLE[selectedPest.label]}`}
                      >
                        <span className="text-[9px] font-bold uppercase tracking-wider">
                          Risk
                        </span>
                        <span className="text-[10px] font-extrabold">
                          {selectedPest.label} (
                          {(selectedPest.risk * 100).toFixed(0)}%)
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center rounded-xl border border-dashed border-black text-slate-500 px-2.5 py-1.5 h-[42px] text-[10px] font-semibold bg-slate-50/30">
                        No Pest Risk
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* ── Strategy & Predict ── */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">
                      Target Strategy
                    </Label>
                    <select
                      className="w-full border border-black rounded-xl p-2.5 bg-slate-50/85 outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 text-sm font-medium text-slate-800 h-[42px] cursor-pointer"
                      value={targetChoice}
                      onChange={(e) => setTargetChoice(e.target.value as any)}
                    >
                      <option value="predicted">ML Predicted Yield</option>
                      <option value="estimated">Farmer Estimated Yield</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isCalculating || !selectedPlotId}
                    className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-bold bg-linear-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange-500/15 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {isCalculating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />{" "}
                        Calculating...
                      </>
                    ) : (
                      <>
                        <BarChart4 className="w-4 h-4" /> Predict Yield
                      </>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── COLUMN 4: Yield simulation results ── */}
          <div className="space-y-5">
            <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white/95 overflow-hidden flex flex-col min-h-[580px]">
              <div className="bg-linear-to-r from-emerald-500 to-teal-600 h-1.5 w-full" />
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="text-xl font-bold text-slate-850 flex items-center gap-2 tracking-tight">
                  <Target className="w-5 h-5 text-emerald-600" /> Yield
                  Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grow flex flex-col ">
                {/* Empty state */}
                {!result && !isCalculating && (
                  <div className="grow flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-20 w-20 rounded-full bg-slate-50 border-2 border-black flex items-center justify-center shadow-inner">
                      <BarChart4 className="w-10 h-10 text-slate-350" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-700 text-lg">
                        No results yet
                      </p>
                      <p className="text-sm text-slate-455 font-medium max-w-xs leading-relaxed">
                        Select a plot, fill in the field details, and click{" "}
                        <span className="font-bold text-emerald-600">
                          Predict Yield
                        </span>
                        .
                      </p>
                    </div>
                  </div>
                )}

                {/* Loading */}
                {isCalculating && (
                  <div className="grow flex flex-col items-center justify-center text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                    <p className="font-bold text-slate-700 animate-pulse">
                      Running yield simulations…
                    </p>
                  </div>
                )}

                {/* Results */}
                {result && !isCalculating && (
                  <div className="space-y-7 animate-in fade-in duration-500">
                    {/* Stat tiles */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          label: "Target Yield",
                          value: `${result.targetYieldKg.toFixed(0)} kg`,
                          sub:
                            result.targetYieldSource ===
                            "ML Predicted Yield (post-damage & conditions)"
                              ? "ML Predicted"
                              : "Farmer Est.",
                          border: "border-2 border-black",
                          bg: "bg-linear-to-br from-sky-50 to-indigo-50/50",
                        },
                        {
                          label: "Surviving Plants",
                          value: result.survivingPlants.toLocaleString(),
                          sub: `of ${result.totalPlants.toLocaleString()}`,
                          border: "border-2 border-black",
                          bg: "bg-slate-50/60",
                        },
                        {
                          label: "Plants Lost",
                          value: result.totalLostPlants.toLocaleString(),
                          sub: `${result.yieldLostPercent.toFixed(1)}% lost`,
                          border: "border-2 border-black",
                          bg: "bg-linear-to-br from-amber-50 to-orange-50/50",
                        },
                        {
                          label: "Damage Area",
                          value: `${result.totalDamageAreaM2.toFixed(0)} m²`,
                          sub: "crop damage",
                          border: "border-2 border-black",
                          bg: "bg-linear-to-br from-rose-50 to-orange-50/50",
                        },
                      ].map(({ label, value, sub, border, bg }) => (
                        <div
                          key={label}
                          className={`${bg} border ${border} rounded-xl p-4 flex flex-col justify-center gap-0.5 hover:shadow-xs transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                        >
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            {label}
                          </p>
                          <p className="text-2xl font-extrabold text-slate-800 leading-tight">
                            {value}
                          </p>
                          <p className="text-xs font-semibold text-slate-400 mt-0.5">
                            {sub}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Action plan Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowActionPlan(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md transition-all duration-200 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" /> View AI Action Plan
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
      {/* Action Plan Modal Overlay */}
      {showActionPlan && result?.actionPlan && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white border-2 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 ">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> AI Action
                Plan
              </h3>
              <button
                type="button"
                onClick={() => setShowActionPlan(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border border-black"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto grow">
              <div className="bg-sky-50/50 border-2 border-black rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-slate-700 leading-relaxed italic">
                  "{result.actionPlan.summary}"
                </p>
              </div>
              <ul className="space-y-4">
                {result.actionPlan.steps.map((step: string, idx: number) => (
                  <li
                    key={idx}
                    className="flex items-start gap-4 bg-white p-4 rounded-xl border border-black hover:border-slate-800 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center shrink-0 text-xs font-extrabold mt-0.5 shadow-sm">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-slate-650 font-medium leading-relaxed">
                      {step}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
