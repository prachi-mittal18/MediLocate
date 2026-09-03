"use client";


import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Siren, ChevronRight, PhoneCall, MessageSquare, ShieldAlert, X, MapPin, ExternalLink, LocateFixed } from "lucide-react";

let L: any = null;

const getHospitalName = (hospital: any) => {
  return (
    hospital.name ||
    hospital.tags?.name ||
    "Unnamed Hospital"
  );
};

const getHospitalDistance = (hospital: any) => {
  return typeof hospital.distanceKm === "number"
    ? hospital.distanceKm
    : null;
};

const formatHospitalDistance = (distanceKm: number | null) => {
  if (distanceKm === null) {
    return null;
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }

  return `${distanceKm.toFixed(1)} km away`;
};

const getHospitalMapsUrl = (
  hospital: any,
  userPos: [number, number] | null
) => {
  if (userPos) {
    return `https://www.google.com/maps/dir/?api=1&origin=${userPos[0]},${userPos[1]}&destination=${hospital.lat},${hospital.lon}`;
  }

  if (hospital.googleMapsUrl) {
    return hospital.googleMapsUrl;
  }

  return "#";
};

// --- Custom Leaflet Icons ---


const createHospitalIcon = () => {
  if (typeof window === "undefined" || !L) return null;

  return L.divIcon({
    html: `<div style="background-color: white; border: 2px solid #ef4444; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; shadow: 0 2px 8px rgba(0,0,0,0.2);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
           </div>`,
    className: "", iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16]
  });
};

const createUserIcon = () => {
  if (typeof window === "undefined" || !L) return null;

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

const MapManager = ({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) => {
  const { useMap } = require("react-leaflet");
  const map = useMap();

  useEffect(() => {
    if (map && center) {
      map.flyTo(center, zoom, {
        animate: true,
      });
    }
  }, [center, zoom, map]);

  return null;
};

export default function HospitalsPage() {
  const [step, setStep] = useState(1); 
  const [leafletReady, setLeafletReady] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(5);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<string[]>([]);
  const [newContact, setNewContact] = useState("");
  const lastEmergencyId = useRef<string | null>(null);
  useEffect(() => {
  import("leaflet").then((leaflet) => {
    L = leaflet.default;
    setLeafletReady(true);
  });
}, []);

  const detectLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Do not let normal location detection
        // override an already detected emergency.
        if (lastEmergencyId.current) {
          return;
        }

        setUserPos([
          pos.coords.latitude,
          pos.coords.longitude,
        ]);

        setStep(2);
      },
      () => {
        // Do not let the fallback location
        // override an already detected emergency.
        if (lastEmergencyId.current) {
          return;
        }

        setUserPos([19.0622, 72.8973]);
        setStep(2);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }
};

  useEffect(() => {
    const saved = localStorage.getItem("emergency_contacts");
    if (saved) setContacts(JSON.parse(saved));
    detectLocation();
  }, []);

  useEffect(() => {
  let isMounted = true;

  const checkForEmergency = async () => {
    try {
      const response = await fetch("/api/emergency/status", {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const emergency = data?.emergency;

      if (!emergency || !isMounted) {
        return;
      }

      // Ignore an emergency that this page has already handled.
      if (lastEmergencyId.current === emergency.id) {
        return;
      }

      lastEmergencyId.current = emergency.id;

      console.log(
        "MediLocate emergency detected:",
        emergency
      );

      // Use the emergency location instead of the
      // browser's normal location.
      setUserPos([
        emergency.latitude,
        emergency.longitude,
      ]);

      // Emergency search automatically uses 3 km.
      setRadius(3);

      // The backend has already found the hospitals.
      setHospitals(emergency.hospitals || []);

      // Go directly to the EXISTING map.
      setStep(4);
    } catch (error) {
      console.error(
        "Emergency status check failed:",
        error
      );
    }
  };

  // Check immediately when the page loads.
  checkForEmergency();

  // Then check periodically.
  const interval = setInterval(
    checkForEmergency,
    2000
  );

  return () => {
    isMounted = false;
    clearInterval(interval);
  };
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

  try {
    const response = await fetch(
      `/api/hospitals/search?latitude=${userPos[0]}&longitude=${userPos[1]}&radius=${radius}`,
      {
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Hospital search failed");
    }

    const sortedHospitals = [...(data.hospitals || [])].sort(
  (a, b) => {
    const distanceA =
      typeof a.distanceKm === "number"
        ? a.distanceKm
        : Number.MAX_SAFE_INTEGER;

    const distanceB =
      typeof b.distanceKm === "number"
        ? b.distanceKm
        : Number.MAX_SAFE_INTEGER;

    return distanceA - distanceB;
  }
);

setHospitals(sortedHospitals);
setStep(4);
  } catch (err) {
    console.error("Hospital Search Error:", err);

    alert(
      "Medical database is busy. Please try again in a moment."
    );
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
              <Marker
  position={userPos}
  icon={leafletReady ? createUserIcon() || undefined : undefined}
/>
              {hospitals.map((h, i) => (
                <Marker key={i} position={[h.lat, h.lon]} icon={leafletReady ? createHospitalIcon() || undefined : undefined}>
                  <Popup>
                    <div className="p-2 text-center">
                      <h4 className="font-black text-slate-900 text-sm mb-2">{h.tags?.name || "Hospital"}</h4>
                      <a href={`https://www.google.com/maps/dir/?api=1&origin=${userPos?.[0]},${userPos?.[1]}&destination=${h.lat},${h.lon}`} target="_blank" className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold no-underline block">DIRECTIONS</a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          )}
        </MapContainer>
      </div>

      {step === 4 && (
  <>
    {/* Ranked Hospital List */}
    <div className="absolute top-6 left-6 z-[2000] w-[360px] max-w-[calc(100vw-110px)]">
      <div className="bg-white/95 backdrop-blur-md rounded-[28px] shadow-2xl border border-white overflow-hidden">

        {/* Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Nearby Hospitals
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Ranked by distance
              </p>
            </div>

            <div className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-black">
              {hospitals.length}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3">
            Hospitals within {radius} km
          </p>
        </div>

        {/* Hospital List */}
        <div className="max-h-[65vh] overflow-y-auto p-3">

          {hospitals.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm font-bold text-slate-600">
                No hospitals found
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Try increasing the search radius.
              </p>
            </div>
          ) : (
            hospitals.map((hospital, index) => {
              const name = getHospitalName(hospital);
              const distance = getHospitalDistance(hospital);
              const mapsUrl = getHospitalMapsUrl(
                hospital,
                userPos
              );

              return (
                <div
                  key={`${hospital.id}-${index}`}
                  className="bg-slate-50 rounded-2xl p-4 mb-3 border border-slate-100"
                >
                  <div className="flex gap-3">

                    {/* Rank */}
<div className="flex-shrink-0 flex flex-col items-center gap-1">
  <div
    className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-black ${
      index === 0 ? "bg-emerald-600" : "bg-blue-600"
    }`}
  >
    {index + 1}
  </div>

  {index === 0 && (
    <span className="text-[8px] font-black text-emerald-600 uppercase whitespace-nowrap">
      Nearest
    </span>
  )}
</div>

                    {/* Hospital Details */}
                    <div className="min-w-0 flex-1">

                      <h3 className="font-black text-sm text-slate-900 leading-tight">
                        {name}
                      </h3>

                      {distance !== null && (
  <p className="text-xs text-slate-500 mt-1">
    {formatHospitalDistance(distance)}
  </p>
)}

                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-3 text-xs font-black text-blue-600 hover:text-blue-800 no-underline"
                      >
                        GET DIRECTIONS
                        <ExternalLink size={13} />
                      </a>

                    </div>

                  </div>
                </div>
              );
            })
          )}

        </div>
      </div>
    </div>

    {/* Change Radius */}
    <button
      onClick={() => setStep(3)}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[2000] bg-white text-black px-6 py-3 rounded-full font-black text-xs shadow-xl border"
    >
      CHANGE RADIUS
    </button>
  </>
)}
    </div>
  );
}