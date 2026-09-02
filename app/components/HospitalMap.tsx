"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- Custom Leaflet Icons ---

const createHospitalIcon = () => {
  if (typeof window === "undefined") return null;
  return L.divIcon({
    html: `<div style="background-color: white; border: 2px solid #ef4444; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; shadow: 0 2px 8px rgba(0,0,0,0.2);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
           </div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const createUserIcon = () => {
  if (typeof window === "undefined") return null;
  return L.divIcon({
    html: `<div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 100%; height: 100%; background-color: #2563eb; border-radius: 50%; opacity: 0.3; animation: ping 2s infinite;"></div>
            <div style="background-color: #2563eb; border: 3px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M21 3L3 10.5L11.5 13L14 21.5L21 3Z" /></svg>
            </div>
           </div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

// --- Dynamically loaded Leaflet components (no SSR) ---

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);
const Circle = dynamic(
  () => import("react-leaflet").then((m) => m.Circle),
  { ssr: false }
);

// --- Map Manager (handles flyTo on center change) ---

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
    if (map && center) map.flyTo(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

// --- Component Props ---

interface HospitalMapProps {
  userPos: [number, number] | null;
  hospitals: any[];
  radius: number; // km
  zoom: number;
  blurred?: boolean;
}

/**
 * Leaflet map component showing the user's position, a search radius circle,
 * and markers for each hospital.
 */
export default function HospitalMap({
  userPos,
  hospitals,
  radius,
  zoom,
  blurred = false,
}: HospitalMapProps) {
  return (
    <div className={`h-full w-full ${blurred ? "blur-xl" : ""}`}>
      <MapContainer
        center={userPos || [19.0622, 72.8973]}
        zoom={15}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        {userPos && (
          <>
            <MapManager center={userPos} zoom={zoom} />
            <Circle
              center={userPos}
              radius={radius * 1000}
              pathOptions={{ color: "#2563eb", fillOpacity: 0.05 }}
            />
            <Marker
              position={userPos}
              icon={createUserIcon() || undefined}
            />
            {hospitals.map((h, i) => (
              <Marker
                key={i}
                position={[h.lat, h.lon]}
                icon={createHospitalIcon() || undefined}
              >
                <Popup>
                  <div className="p-2 text-center">
                    <h4 className="font-black text-slate-900 text-sm mb-2">
                      {h.tags?.name || "Hospital"}
                    </h4>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`}
                      target="_blank"
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold no-underline block"
                    >
                      DIRECTIONS
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}
      </MapContainer>
    </div>
  );
}
