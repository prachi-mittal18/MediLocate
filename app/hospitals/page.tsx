"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Siren, ChevronRight, PhoneCall, MessageSquare, ShieldAlert, X, MapPin, ExternalLink, LocateFixed } from "lucide-react";
import "leaflet/dist/leaflet.css";

// --- Custom Leaflet Icons ---
import L from "leaflet";

const createHospitalIcon = () => {
  if (typeof window === 'undefined') return null;
  return L.divIcon({
    html: `<div style="background-color: white; border: 2px solid #ef4444; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; shadow: 0 2px 8px rgba(0,0,0,0.2);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
           </div>`,
    className: "", iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16]
  });
};

const createUserIcon = () => {
  if (typeof window === 'undefined') return null;
  return L.divIcon({
    html: `<div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 100%; height: 100%; background-color: #2563eb; border-radius: 50%; opacity: 0.3; animation: ping 2s infinite;"></div>
            <div style="background-color: #2563eb; border: 3px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M21 3L3 10.5L11.5 13L14 21.5L21 3Z" /></svg>
            </div>
           </div>`,
    className: "", iconSize: [36, 36], iconAnchor: [18, 18],
  });
};

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then((m) => m.Circle), { ssr: false });

const MapManager = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const { useMap } = require("react-leaflet");
  const map = useMap();
  useEffect(() => { if (map && center) map.flyTo(center, zoom, { animate: true }); }, [center, zoom, map]);
  return null;
};

export default function HospitalsPage() {
  const [step, setStep] = useState(1); 
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(5);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<string[]>([]);
  const [newContact, setNewContact] = useState("");

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserPos([pos.coords.latitude, pos.coords.longitude]); setStep(2); },
        () => { setUserPos([19.0622, 72.8973]); setStep(2); },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("emergency_contacts");
    if (saved) setContacts(JSON.parse(saved));
    detectLocation();
  }, []);

  const saveContact = () => {
    if (contacts.length < 5 && newContact) {
      const updated = [...contacts, newContact];
      setContacts(updated);
      localStorage.setItem("emergency_contacts", JSON.stringify(updated));
      setNewContact("");
    }
  };

  const fetchHospitals = async () => {
    if (!userPos) return;
    setLoading(true);
    const query = `[out:json];node["amenity"="hospital"](around:${radius * 1000},${userPos[0]},${userPos[1]});out body;`;
    try {
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const text = await res.text();
      const data = JSON.parse(text); // Manual parse to catch errors
      setHospitals(data.elements || []);
      setStep(4);
    } catch (err) {
      console.error("API Error:", err);
      alert("Medical database is busy. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full bg-slate-50 overflow-hidden">
      {step === 1 && (
        <div className="absolute inset-0 z-[5000] bg-white flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-black text-slate-800 animate-pulse text-xs">LOCATING...</p>
        </div>
      )}

      <button onClick={() => setShowSOSModal(true)} className="absolute top-6 right-6 z-[3000] bg-red-600 text-white p-5 rounded-full shadow-2xl animate-pulse border-4 border-white"><ShieldAlert size={32} /></button>

      {showSOSModal && (
        <div className="absolute inset-0 z-[4000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-6 relative">
            <button onClick={() => setShowSOSModal(false)} className="absolute top-5 right-5 text-slate-400"><X size={24} /></button>
            <h2 className="text-2xl font-black text-red-600 mb-6 flex items-center gap-2"><Siren /> Emergency Hub</h2>
            <button onClick={() => window.location.href = "tel:102"} className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold mb-3 flex items-center justify-center gap-2"><PhoneCall /> CALL AMBULANCE</button>
            <div className="mt-4">
                <h3 className="text-[10px] font-black text-slate-400 mb-2 uppercase">Saved Contacts ({contacts.length}/5)</h3>
                {contacts.map((c, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <button className="flex-1 bg-slate-50 p-3 rounded-xl font-bold text-left" onClick={() => window.location.href=`tel:${c}`}>{c}</button>
                  </div>
                ))}
                {contacts.length < 5 && (
                  <div className="flex gap-2 mt-2">
                    <input type="tel" value={newContact} onChange={(e) => setNewContact(e.target.value)} placeholder="Add Number" className="flex-1 bg-slate-100 p-3 rounded-xl outline-none text-black font-bold" />
                    <button onClick={saveContact} className="bg-black text-white px-4 rounded-xl font-bold">ADD</button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="absolute inset-0 z-[2500] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-sm text-center shadow-2xl">
            <h3 className="text-2xl font-black text-black">Location Found</h3>
            <p className="text-slate-500 text-sm mt-3 mb-8">Search for hospitals in this area?</p>
            <button onClick={() => setStep(3)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl">START SEARCH</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="absolute inset-0 z-[2400] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-sm">
            <div className="flex justify-between mb-6">
              <span className="font-black text-black uppercase text-[11px]">Radius</span>
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">{radius} KM</span>
            </div>
            <input type="range" min="1" max="25" value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} className="w-full mb-8" />
            <button onClick={fetchHospitals} disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-bold">
              {loading ? "SEARCHING..." : "FIND HOSPITALS"}
            </button>
          </div>
        </div>
      )}

      <div className={`h-full w-full ${step < 4 ? "blur-xl" : ""}`}>
        <MapContainer center={userPos || [19.0622, 72.8973]} zoom={15} className="h-full w-full" zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          {userPos && (
            <>
              <MapManager center={userPos} zoom={step === 4 ? 14 : 15} />
              <Circle center={userPos} radius={radius * 1000} pathOptions={{ color: "#2563eb", fillOpacity: 0.05 }} />
              <Marker position={userPos} icon={createUserIcon() || undefined} />
              {hospitals.map((h, i) => (
                <Marker key={i} position={[h.lat, h.lon]} icon={createHospitalIcon() || undefined}>
                  <Popup>
                    <div className="p-2 text-center">
                      <h4 className="font-black text-slate-900 text-sm mb-2">{h.tags?.name || "Hospital"}</h4>
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`} target="_blank" className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold no-underline block">DIRECTIONS</a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          )}
        </MapContainer>
      </div>

      {step === 4 && (
        <button onClick={() => setStep(3)} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[2000] bg-white text-black px-6 py-3 rounded-full font-black text-xs shadow-xl border">
          CHANGE RADIUS
        </button>
      )}
    </div>
  );
}