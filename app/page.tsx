
// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "loading" | "success" | "error";

type GeocodedLocation = {
  placeId?: number;
  osmType?: string;
  osmId?: number;
  displayName: string;
  lat: number;
  lon: number;
  address?: Record<string, string>;
};


export default function Home() {
  const router = useRouter();

  const [status, setStatus] = useState<Status>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [manualLocation, setManualLocation] = useState("");
  const [message, setMessage] = useState("");
  
const [locationResults, setLocationResults] = useState<
  GeocodedLocation[]
>([]);
const [locationSearchMessage, setLocationSearchMessage] = useState("");
const [searchingLocation, setSearchingLocation] = useState(false);


  // Try auto-location on first load
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setMessage("Your browser does not support location. Please enter your area manually.");
      return;
    }

    setStatus("loading");
    setMessage("Detecting your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setStatus("success");
        setMessage("Location detected. You can continue or change area manually.");
      },
      (err) => {
        console.error("Geolocation error", err);
        setStatus("error");
        if (err.code === err.PERMISSION_DENIED) {
          setMessage("Location permission denied. Please allow location or enter your area manually.");
        } else {
          setMessage("Unable to access your location. Please enter your area manually.");
        }
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  const hasLocation =
    status === "success" || manualLocation.trim().length > 0;

  
const handleContinue = async () => {
  const typedLocation = manualLocation.trim();

  // A typed location takes priority over detected GPS coordinates.
  if (typedLocation) {
    setSearchingLocation(true);
    setLocationSearchMessage("");
    setLocationResults([]);

    try {
      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(typedLocation)}`,
        { cache: "no-store" }
      );

      const data = (await response.json()) as {
        locations?: GeocodedLocation[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error || "Location lookup failed."
        );
      }

      const results = Array.isArray(data.locations)
        ? data.locations
        : [];

      setLocationResults(results);

      setLocationSearchMessage(
        results.length > 0
          ? "Select the correct location below."
          : "No matching locations found. Try adding the city and state."
      );
    } catch (error) {
      console.error("Location lookup failed:", error);

      setLocationSearchMessage(
        error instanceof Error
          ? error.message
          : "Could not look up this location. Please try again."
      );
    } finally {
      setSearchingLocation(false);
    }

    return;
  }

  // No typed location: continue using the detected GPS coordinates.
  if (coords) {
    const params = new URLSearchParams({
      lat: coords.lat.toString(),
      lng: coords.lng.toString(),
    });

    router.push(`/hospitals?${params.toString()}`);
    return;
  }

  setMessage(
    "Please use your current location or enter an area manually."
  );
};

const handleSelectLocation = (
  location: GeocodedLocation
) => {
  const params = new URLSearchParams({
    lat: location.lat.toString(),
    lng: location.lon.toString(),
    location: location.displayName,
  });

  router.push(`/hospitals?${params.toString()}`);
};


  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md mx-auto bg-white shadow-md rounded-2xl p-6 space-y-6">
        <header className="space-y-1">
          <p className="text-xs font-medium text-sky-600 uppercase tracking-wide">
            Step 1 of 2
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Share your location
          </h1>
          <p className="text-sm text-slate-500">
            To find hospitals near you, this app needs your location. You can allow access or type your area manually.
          </p>
        </header>

        {/* Use my current location */}
        <button
          type="button"
          onClick={() => {
            if (!("geolocation" in navigator)) {
              setStatus("error");
              setMessage("Your browser does not support location. Please enter your area manually.");
              return;
            }

            setStatus("loading");
            setMessage("Detecting your location...");

            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                setCoords({ lat: latitude, lng: longitude });
                setStatus("success");
                setMessage("Location detected. You can continue or change area manually.");
              },
              (err) => {
                console.error("Geolocation error", err);
                setStatus("error");
                if (err.code === err.PERMISSION_DENIED) {
                  setMessage("Location permission denied. Please allow location or enter your area manually.");
                } else {
                  setMessage("Unable to access your location. Please enter your area manually.");
                }
              },
              { enableHighAccuracy: false, timeout: 10000 }
            );
          }}
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
              Approximate coordinates: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
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
            
onChange={(e) => {
  setManualLocation(e.target.value);
  setLocationResults([]);
  setLocationSearchMessage("");
}}

            placeholder="City, locality (e.g., Nagpur, Maharashtra)"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
          <p className="text-xs text-slate-500">
            This helps show hospitals relevant to your area.
          </p>
          
{locationSearchMessage && (
  <p
    role="status"
    className={`text-xs ${
      locationResults.length > 0
        ? "text-emerald-600"
        : "text-red-600"
    }`}
  >
    {locationSearchMessage}
  </p>
)}

{locationResults.length > 0 && (
  <div className="space-y-2 pt-2">
    <p className="text-xs font-semibold text-slate-700">
      Choose the matching location:
    </p>

    {locationResults.map((location, index) => (
      <button
        key={`${location.osmType ?? "place"}-${
          location.osmId ?? location.placeId ?? index
        }`}
        type="button"
        onClick={() => handleSelectLocation(location)}
        className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-sky-500 hover:bg-sky-50"
      >
        <span className="block text-sm font-medium text-slate-900">
          {location.displayName}
        </span>

        <span className="mt-1 block text-xs text-slate-500">
          {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
        </span>
      </button>
    ))}
  </div>
)}

        </div>

        {/* Continue */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            disabled={!hasLocation || searchingLocation}
            onClick={handleContinue}
            className={`w-full rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
              hasLocation
                ? "bg-sky-600 hover:bg-sky-700"
                : "bg-slate-300 cursor-not-allowed"
            }`}
          >
            
{searchingLocation
  ? "SEARCHING LOCATION..."
  : manualLocation.trim()
  ? "SEARCH LOCATION"
  : "CONTINUE"}

          </button>
        </div>
      </div>
    </main>
  );
}
