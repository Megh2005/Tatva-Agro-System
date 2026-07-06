"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import BackgroundPattern from "@/components/BackgroundPattern";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "react-toastify";
import {
  UploadCloud,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  Calendar,
  Activity,
  ShieldAlert,
  Sprout,
  ChevronRight,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { T } from "@/components/TranslationContext";
import SpeechButton from "@/components/SpeechButton";
import YouTubeVideos from "@/components/YouTubeVideos";

interface PlanStep {
  week: string;
  medication: string;
  dosage: string;
  instructions: string;
}

interface DiseaseAnalysisResult {
  found: boolean;
  diseaseName: string;
  severity: string;
  confidence: number;
  description: string;
  quickFix: string;
  weeklyPlan: PlanStep[];
  inputImage: string;
}

type TabType = "diagnosis" | "cures" | "timeline";

export default function DiseaseDiagnosticsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiseaseAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("diagnosis");
  const [analysisPhase, setAnalysisPhase] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null); // Clear previous results
      setActiveTab("diagnosis");
    }
  };

  const runPhaseSimulation = (phases: string[], callback: () => void) => {
    let index = 0;
    setAnalysisPhase(phases[0]);
    const interval = setInterval(() => {
      index++;
      if (index < phases.length) {
        setAnalysisPhase(phases[index]);
      } else {
        clearInterval(interval);
        callback();
      }
    }, 500);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please upload a crop image.");
      return;
    }

    setIsAnalyzing(true);
    const phases = [
      "Uploading crop sample...",
      "Analyzing chlorophyll and lesion maps...",
      "Identifying pathogen markers...",
      "Synthesizing 4-week recovery schedule...",
    ];

    runPhaseSimulation(phases, async () => {
      try {
        const formData = new FormData();
        formData.append("image", selectedFile);

        const response = await fetch("/api/disease", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Analysis failed");
        }

        setResult(data);
        toast.success("Analysis complete!");
      } catch (error: any) {
        console.error("Analysis Error:", error);
        toast.error(error.message || "Failed to analyze crop sample.");
      } finally {
        setIsAnalyzing(false);
      }
    });
  };

  return (
    <div className="min-h-screen pb-24 pt-6 px-4 flex justify-center">
      <BackgroundPattern />

      <div className="w-full max-w-[90vw] z-10 relative space-y-6">
        {/* Header section with back buttons */}
        <div className="text-center mb-6 relative">
          <div className="absolute left-0 top-0 hidden md:block">
            <Link href="/">
              <button className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold bg-white border-2 border-black text-slate-800 hover:bg-slate-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
                Home
              </button>
            </Link>
          </div>

          <div className="md:hidden mb-6 flex justify-start">
            <Link href="/">
              <button className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold bg-white border-2 border-black text-slate-800 hover:bg-slate-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </Link>
          </div>

          <h1 className="mb-2 text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-900 dark:text-white">
            Crop Disease{" "}
            <span className="bg-linear-to-r from-orange-500 via-amber-500 to-emerald-600 bg-clip-text text-transparent">
              Analyzer
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium tracking-tight mt-1">
            Diagnose crop leaf diseases and retrieve a tailored 4-week recovery medication calendar.
          </p>
        </div>

        {/* Workspace split grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left panel: Sample upload */}
          <Card className="lg:col-span-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white dark:bg-zinc-950 overflow-hidden">
            <div className="bg-linear-to-r from-orange-500 to-amber-500 h-1.5 w-full border-b-2 border-black"></div>
            <CardHeader className="py-3 px-4 border-b-2 border-black bg-slate-50 dark:bg-zinc-900/50">
              <CardTitle className="text-xl font-black text-slate-850 dark:text-white flex items-center gap-2 tracking-tight">
                <Sprout className="w-5 h-5 text-emerald-600" />
                Upload Image
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div
                  className={cn(
                    "border-2 border-dashed border-black rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                    previewUrl
                      ? "bg-emerald-50/30 dark:bg-emerald-950/10"
                      : "bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900/20 dark:hover:bg-zinc-900/40"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />

                  {previewUrl ? (
                    <div className="space-y-4 flex flex-col items-center">
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-black shadow-sm">
                        <Image
                          src={previewUrl}
                          alt="Crop sample preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Image Selected
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 flex flex-col items-center justify-center py-4">
                      <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-full border border-black shadow-sm">
                        <UploadCloud className="w-7 h-7 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-350">
                          Click to upload leaf photo
                        </p>
                        <p className="text-[10px] text-slate-450 mt-0.5">
                          Supports PNG, JPG, JPEG
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!selectedFile || isAnalyzing}
                  className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-white bg-linear-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-sm uppercase tracking-wider"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4" />
                      Analyze Crop Health
                    </>
                  )}
                </button>
              </form>
            </CardContent>
          </Card>

          {/* Right panel: Tabbed Results display */}
          <Card className="lg:col-span-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white dark:bg-zinc-950 overflow-hidden flex flex-col min-h-[460px]">
            <div className="bg-linear-to-r from-emerald-500 via-teal-500 to-emerald-600 h-1.5 w-full border-b-2 border-black"></div>
            <CardHeader className="py-3 px-4 border-b-2 border-black bg-slate-50 dark:bg-zinc-900/50 flex flex-row items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-xl font-black text-slate-850 dark:text-white flex items-center gap-2 tracking-tight">
                  <ClipboardList className="w-5 h-5 text-emerald-600" />
                  Analysis Results
                </CardTitle>
              </div>

              {/* Tabs Switcher */}
              {result && !isAnalyzing && (
                <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-full border-2 border-black select-none">
                  {(["diagnosis", "cures", "timeline"] as TabType[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "relative px-4 py-1.5 text-xs font-black uppercase rounded-full transition-all duration-250 cursor-pointer",
                        activeTab === tab
                          ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                      )}
                    >
                      {tab === "diagnosis" && "Diagnosis"}
                      {tab === "cures" && "Cures"}
                      {tab === "timeline" && "Weekly Plan"}
                    </button>
                  ))}
                </div>
              )}
            </CardHeader>

            <CardContent className="p-4 grow flex flex-col justify-center">
              {/* Empty state */}
              {!result && !isAnalyzing && (
                <div className="grow flex flex-col items-center justify-center text-center py-12 space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Leaf className="w-12 h-12 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                      No results yet
                    </p>
                    <p className="text-sm max-w-sm text-slate-500 dark:text-slate-400 font-medium">
                      Upload a photo of your crop leaf on the left panel, and click "Analyze Crop Health".
                    </p>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isAnalyzing && (
                <div className="grow flex flex-col items-center justify-center text-center py-12 space-y-6">
                  <div className="relative flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-emerald-500 animate-spin" />
                    <Leaf className="w-8 h-8 text-emerald-500 absolute animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-800 dark:text-slate-200 text-lg">
                      Running Diagnostics
                    </p>
                    <p className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 animate-pulse tracking-widest">
                      {analysisPhase}
                    </p>
                  </div>
                </div>
              )}

              {/* Active Tab Content */}
              {result && !isAnalyzing && (
                <div className="space-y-4">
                  <AnimatePresence mode="wait">
                    {/* Tab 1: Diagnosis */}
                    {activeTab === "diagnosis" && (
                      <motion.div
                        key="diagnosis"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                          {/* Left: Crop image */}
                          <div className="md:col-span-4 space-y-2">
                            <label className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                              Analyzed Sample
                            </label>
                            <div className="relative aspect-square w-full rounded-2xl overflow-hidden border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-zinc-900">
                              <Image
                                src={result.inputImage}
                                alt="Crop sample"
                                fill
                                className="object-cover"
                              />
                            </div>
                          </div>

                          {/* Right: Diagnosis text parameters */}
                          <div className="md:col-span-8 space-y-4">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                {result.found ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-600 border-2 border-black text-[10px] font-black uppercase rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                    <T>Disease Found</T>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-655 border-2 border-black text-[10px] font-black uppercase rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <T>Healthy foliage</T>
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-50 text-slate-800 border-2 border-black text-[10px] font-black uppercase rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                  <T>Severity</T>: <T>{result.severity}</T>
                                </span>
                              </div>
                              <h3 className="text-2xl sm:text-3xl font-black text-slate-850 dark:text-white leading-tight flex items-center gap-2">
                                <T>{result.diseaseName}</T>
                                <SpeechButton
                                  text={`${result.diseaseName}. ${result.description}`}
                                  className="h-7 w-7 p-1 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] rounded-lg"
                                />
                              </h3>
                            </div>

                            {/* Confidence rating */}
                            <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-2 border-black rounded-2xl space-y-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                                <span>AI Confidence</span>
                                <span className="text-emerald-600 font-extrabold">{(result.confidence * 100).toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden border border-black">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${result.confidence * 100}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                  className="h-full bg-emerald-500 rounded-full"
                                />
                              </div>
                            </div>

                            {/* Short path log */}
                            <div className="space-y-1">
                              <p className="text-slate-600 dark:text-slate-350 text-sm leading-relaxed font-medium">
                                <T>{result.description}</T>
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Tab 2: Immediate Cures */}
                    {activeTab === "cures" && (
                      <motion.div
                        key="cures"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="p-4 bg-orange-50/50 dark:bg-orange-950/10 border-2 border-black rounded-2xl space-y-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-orange-600" />
                              <h4 className="text-xs font-black uppercase tracking-wider text-orange-800 dark:text-orange-350">
                                <T>Probable Fix</T>
                              </h4>
                            </div>
                            <SpeechButton text={result.quickFix} className="h-7 w-7 p-1 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" />
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-black shadow-inner">
                            <T>{result.quickFix}</T>
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border-2 border-black p-4 rounded-2xl bg-white dark:bg-zinc-900/10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600"><T>Cultural Remedies</T></span>
                            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-bold list-none pl-0">
                              <li className="flex items-start gap-1.5">
                                <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <T>Drain fields immediately to restrict splash dispersion.</T>
                              </li>
                              <li className="flex items-start gap-1.5">
                                <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <T>Clear wild grass borders and weed blocks.</T>
                              </li>
                            </ul>
                          </div>

                          <div className="border-2 border-black p-4 rounded-2xl bg-white dark:bg-zinc-900/10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600"><T>Nutritional Remedies</T></span>
                            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-bold list-none pl-0">
                              <li className="flex items-start gap-1.5">
                                <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <T>Stop Nitrogen application until active spots dry up.</T>
                              </li>
                              <li className="flex items-start gap-1.5">
                                <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <T>Spray Potassium blend to encourage foliar recovery.</T>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Tab 3: Weekly Plan */}
                    {activeTab === "timeline" && (
                      <motion.div
                        key="timeline"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {result.weeklyPlan.map((step, idx) => (
                            <div
                              key={idx}
                              className="border-2 border-black rounded-2xl bg-white dark:bg-zinc-900/10 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-3 relative overflow-hidden flex flex-col justify-between"
                            >
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                    <T>{step.week}</T>
                                  </span>
                                </div>
                                <h5 className="text-sm font-black text-slate-850 dark:text-white leading-tight">
                                  <T>{step.medication}</T>
                                </h5>
                              </div>

                              <div className="space-y-2 border-t border-slate-100 dark:border-zinc-900 pt-2 text-[11px] leading-relaxed">
                                <div className="grid grid-cols-12 gap-1 font-bold">
                                  <span className="col-span-3 text-slate-450 uppercase tracking-wider text-[9px]"><T>Dose</T>:</span>
                                  <span className="col-span-9 text-slate-750 dark:text-slate-350"><T>{step.dosage}</T></span>
                                </div>
                                <div className="grid grid-cols-12 gap-1 font-bold">
                                  <span className="col-span-3 text-slate-450 uppercase tracking-wider text-[9px]"><T>Guides</T>:</span>
                                  <span className="col-span-9 text-slate-600 dark:text-slate-400 font-medium"><T>{step.instructions}</T></span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {result && !isAnalyzing && (
          <div className="mt-8">
            <YouTubeVideos query={`${result.diseaseName} treatment crop disease control`} title="Learn More on YouTube" />
          </div>
        )}
      </div>
    </div>
  );
}
