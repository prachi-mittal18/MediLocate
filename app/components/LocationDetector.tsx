"use client";

import { useEffect, useState } from "react";

interface LocationDetectorProps {
  onLocationDetected: (coords: { lat: number; lng: number }) => void;
  onContinue: (params: URLSearchParams) => void;
}

type Status = "idle" | "loading" | "success" | "error";

/**
 * Reusable location-detection component with manual-input fallback.
 * Extracted from the home page (app/page.tsx).
 */
export default function LocationDetector({
  onLocationDetected,
  onContinue,
}: LocationDetectorProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [manualLocation, setManualLocation] = useState("");
  const [message, setMessage] = useState("");

  const requestGeolocation = () => {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setMessage(
        "Your browser does not support location. Please enter your area manually."
      );
      return;
    }

    setStatus("loading");
    setMessage("Detecting your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCoords = { lat: latitude, lng: longitude };
        setCoords(newCoords);
        setStatus("success");
        setMessage(
          "Location detected. You can continue or change area manually."
        );
        onLocationDetected(newCoords);
      },
      (err) => {
        console.error("Geolocation error", err);
        setStatus("error");
        if (err.code === err.PERMISSION_DENIED) {
          setMessage(
            "Location permission denied. Please allow location or enter your area manually."
          );
        } else {
          setMessage(
            "Unable to access your location. Please enter your area manually."
          );
        }
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  // Try auto-location on first load
  useEffect(() => {
    requestGeolocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasLocation =
    status === "success" || manualLocation.trim().length > 0;

  const handleContinue = () => {
    const params = new URLSearchParams();
    if (coords) {
      params.set("lat", coords.lat.toString());
      params.set("lng", coords.lng.toString());
    }
    if (manualLocation.trim()) {
      params.set("location", manualLocation.trim());
    }
    onContinue(params);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white shadow-md rounded-2xl p-6 space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-medium text-sky-600 uppercase tracking-wide">
          Step 1 of 2
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Share your location
        </h1>
        <p className="text-sm text-slate-500">
          To find hospitals near you, this app needs your location. You can
          allow access or type your area manually.
        </p>
      </header>

      {/* Use my current location */}
      <button
        type="button"
        onClick={requestGeolocation}
        className="w-full flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-left hover:bg-sky-100 transition"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-white text-lg">
          📍
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">
            Use my current location
          </p>
          <p className="text-xs text-slate-500">
            Your location is used only to show nearby hospitals.
          </p>
        </div>
      </button>

      {/* Status + coords */}
      <div className="space-y-1">
        {message && (
          <p
            className={`text-sm ${
              status === "error"
                ? "text-red-600"
                : status === "loading"
                ? "text-sky-600"
                : "text-emerald-600"
            }`}
          >
            {message}
          </p>
        )}
        {coords && (
          <p className="text-xs text-slate-500">
            Approximate coordinates: {coords.lat.toFixed(4)},{" "}
            {coords.lng.toFixed(4)}
          </p>
        )}
      </div>

      {/* Manual location */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-800">
          Or enter your area
        </label>
        <input
          type="text"
          value={manualLocation}
          onChange={(e) => setManualLocation(e.target.value)}
          placeholder="City, locality (e.g., Nagpur, Maharashtra)"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
        <p className="text-xs text-slate-500">
          This helps show hospitals relevant to your area.
        </p>
      </div>

      {/* Continue */}
      <div className="pt-2 space-y-2">
        <button
          type="button"
          disabled={!hasLocation}
          onClick={handleContinue}
          className={`w-full rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
            hasLocation
              ? "bg-sky-600 hover:bg-sky-700"
              : "bg-slate-300 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
