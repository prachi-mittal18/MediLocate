"use client";

import React, { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import SOSModal from "../components/SOSModal";
import HospitalMap from "../components/HospitalMap";

export default function HospitalsPage() {
  const [step, setStep] = useState(1);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(5);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // --- Location Detection ---
  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPos([pos.coords.latitude, pos.coords.longitude]);
          setStep(2);
        },
        () => {
          setUserPos([19.0622, 72.8973]);
          setStep(2);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  // --- Fetch Hospitals ---
  const fetchHospitals = async () => {
    if (!userPos) return;
    setLoading(true);
    const query = `[out:json];node["amenity"="hospital"](around:${
      radius * 1000
    },${userPos[0]},${userPos[1]});out body;`;
    try {
      const res = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
          query
        )}`
      );
      const text = await res.text();
      const data = JSON.parse(text);
      setHospitals(data.elements || []);
      setStep(4);
    } catch (err) {
      console.error("API Error:", err);
      alert("Medical database is busy. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---
  return (
    <div className="relative h-screen w-full bg-slate-50 overflow-hidden">
      {/* Step 1 — Loading spinner */}
      {step === 1 && (
        <div className="absolute inset-0 z-[5000] bg-white flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-black text-slate-800 animate-pulse text-xs">
            LOCATING...
          </p>
        </div>
      )}

      {/* SOS Button */}
      <button
        onClick={() => setShowSOSModal(true)}
        className="absolute top-6 right-6 z-[3000] bg-red-600 text-white p-5 rounded-full shadow-2xl animate-pulse border-4 border-white"
      >
        <ShieldAlert size={32} />
      </button>

      {/* SOS Modal */}
      <SOSModal isOpen={showSOSModal} onClose={() => setShowSOSModal(false)} />

      {/* Step 2 — Location found confirmation */}
      {step === 2 && (
        <div className="absolute inset-0 z-[2500] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-sm text-center shadow-2xl">
            <h3 className="text-2xl font-black text-black">Location Found</h3>
            <p className="text-slate-500 text-sm mt-3 mb-8">
              Search for hospitals in this area?
            </p>
            <button
              onClick={() => setStep(3)}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl"
            >
              START SEARCH
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Radius selector */}
      {step === 3 && (
        <div className="absolute inset-0 z-[2400] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-sm">
            <div className="flex justify-between mb-6">
              <span className="font-black text-black uppercase text-[11px]">
                Radius
              </span>
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                {radius} KM
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full mb-8"
            />
            <button
              onClick={fetchHospitals}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-bold"
            >
              {loading ? "SEARCHING..." : "FIND HOSPITALS"}
            </button>
          </div>
        </div>
      )}

      {/* Map */}
      <HospitalMap
        userPos={userPos}
        hospitals={hospitals}
        radius={radius}
        zoom={step === 4 ? 14 : 15}
        blurred={step < 4}
      />

      {/* Change radius button (visible after search) */}
      {step === 4 && (
        <button
          onClick={() => setStep(3)}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[2000] bg-white text-black px-6 py-3 rounded-full font-black text-xs shadow-xl border"
        >
          CHANGE RADIUS
        </button>
      )}
    </div>
  );
}