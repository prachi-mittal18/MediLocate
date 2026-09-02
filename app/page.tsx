
// app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import LocationDetector from "./components/LocationDetector";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <LocationDetector
        onLocationDetected={() => {
          // Location detected — no-op, the component shows feedback internally
        }}
        onContinue={(params) => {
          router.push(`/hospitals?${params.toString()}`);
        }}
      />
    </main>
  );
}
