"use client";

import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { UploadCloud, Camera, SwitchCamera, CheckCircle2, X, RefreshCw, ZoomIn } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClear?: () => void;
  previewUrl?: string | null;
  accept?: string;
}

type Mode = "upload" | "camera";
type FacingMode = "environment" | "user";

export default function CameraCapture({
  onCapture,
  onClear,
  previewUrl,
  accept = "image/*",
}: CameraCaptureProps) {
  const [mode, setMode] = useState<Mode>("upload");
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [cameraReady, setCameraReady] = useState(false);
  const [flash, setFlash] = useState(false);
  const [captured, setCaptured] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);

  // --- Upload handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
  };

  const handleClearUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear?.();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Camera handlers ---
  const handleOpenCamera = () => {
    setCaptured(false);
    setCameraReady(false);
    setMode("camera");
  };

  const handleOpenUpload = () => {
    setMode("upload");
    setCaptured(false);
  };

  const handleSwitchCamera = () => {
    setCameraReady(false);
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 180);

    // Convert data URL to File
    fetch(imageSrc)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
        setCaptured(true);
      });
  }, [onCapture]);

  const handleRetake = () => {
    onClear?.();
    setCaptured(false);
    setCameraReady(false);
  };

  const videoConstraints = {
    facingMode,
    width: { ideal: 1280 },
    height: { ideal: 720 },
  };

  return (
    <div className="space-y-3">
      {/* Tab bar */}
      <div className="flex rounded-xl border-2 border-black overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <button
          type="button"
          onClick={handleOpenUpload}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors duration-200 cursor-pointer
            ${mode === "upload" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          Upload File
        </button>
        <div className="w-px bg-black" />
        <button
          type="button"
          onClick={handleOpenCamera}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors duration-200 cursor-pointer
            ${mode === "camera" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
        >
          <Camera className="w-3.5 h-3.5" />
          Live Camera
        </button>
      </div>

      {/* === UPLOAD MODE === */}
      {mode === "upload" && (
        <div
          className={`border-2 border-dashed border-black rounded-2xl p-5 text-center transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            ${previewUrl ? "bg-emerald-50/30 cursor-default" : "bg-slate-50 hover:bg-slate-100 cursor-pointer"}`}
          onClick={() => !previewUrl && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileChange}
          />

          {previewUrl ? (
            <div className="space-y-3 flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Selected image preview"
                className="w-full aspect-video rounded-xl object-cover border-2 border-black shadow-sm"
              />
              <p className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Image Ready
              </p>
              <button
                type="button"
                onClick={handleClearUpload}
                className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-lg px-2.5 py-1 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                Remove & Re-upload
              </button>
            </div>
          ) : (
            <div className="space-y-3 flex flex-col items-center justify-center py-4">
              <div className="p-3 bg-white rounded-full border-2 border-black shadow-sm">
                <UploadCloud className="w-7 h-7 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Click to browse image</p>
                <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, JPEG — up to 10 MB</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === CAMERA MODE === */}
      {mode === "camera" && (
        <div className="relative rounded-2xl overflow-hidden border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-black">

          {/* Captured preview */}
          {captured && previewUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Captured photo"
                className="w-full aspect-video object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end items-center pb-4 gap-2">
                <p className="text-white text-sm font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Photo Captured
                </p>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex items-center gap-1.5 bg-white text-slate-900 text-xs font-bold rounded-xl px-4 py-2 border-2 border-black cursor-pointer hover:bg-slate-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retake Photo
                </button>
              </div>
            </div>
          ) : (
            /* Live webcam */
            <div className="relative">
              {/* Loading shimmer while camera initialises */}
              {!cameraReady && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-zinc-900 aspect-video">
                  <Camera className="w-8 h-8 text-zinc-500 animate-pulse" />
                  <p className="text-zinc-400 text-xs font-bold">Starting camera…</p>
                </div>
              )}

              {/* Flash overlay */}
              {flash && (
                <div className="absolute inset-0 z-20 bg-white opacity-70 pointer-events-none" />
              )}

              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.92}
                videoConstraints={videoConstraints}
                onUserMedia={() => setCameraReady(true)}
                onUserMediaError={() => setCameraReady(false)}
                className="w-full aspect-video object-cover"
                mirrored={facingMode === "user"}
              />

              {/* Controls overlay — only when camera is ready */}
              {cameraReady && (
                <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none">
                  {/* Top-right: switch camera */}
                  <div className="flex justify-end pointer-events-auto">
                    <button
                      type="button"
                      onClick={handleSwitchCamera}
                      title="Flip camera"
                      className="h-9 w-9 flex items-center justify-center rounded-full bg-black/55 backdrop-blur-sm border border-white/25 text-white hover:bg-black/75 transition-colors cursor-pointer"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bottom: shutter button */}
                  <div className="flex items-center justify-center pointer-events-auto">
                    <button
                      type="button"
                      onClick={handleCapture}
                      title="Take photo"
                      className="h-16 w-16 flex items-center justify-center rounded-full bg-white border-4 border-black shadow-xl hover:scale-95 active:scale-90 transition-transform duration-150 cursor-pointer"
                    >
                      <div className="h-11 w-11 rounded-full bg-slate-900" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Camera hint text */}
      {mode === "camera" && !captured && (
        <p className="text-center text-[10px] text-slate-400 font-medium">
          Works with phone camera (front &amp; rear) and laptop webcam
        </p>
      )}
    </div>
  );
}
