import { NextRequest, NextResponse } from "next/server";
import {
  findNearbyHospitals,
  calculateDistanceKm,
} from "@/lib/hospitals";

const EMERGENCY_RADIUS_KM = 3;

type EmergencyEvent = {
  id: string;
  deviceId: string;
  eventType: string;
  severity: string;
  latitude: number;
  longitude: number;
  sensorData?: {
    acceleration?: number;
    rotation?: number;
    heartRate?: number;
    movement?: boolean;
  };
  timestamp: string;
  hospitals: any[];
  nearestHospital: any | null;
};

// Temporary storage for our local prototype.
// We are deliberately NOT adding MongoDB for this feature.
const globalForEmergency = globalThis as typeof globalThis & {
  __latestEmergency?: EmergencyEvent | null;
};

if (globalForEmergency.__latestEmergency === undefined) {
  globalForEmergency.__latestEmergency = null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      deviceId,
      eventType,
      severity,
      latitude,
      longitude,
      sensorData,
      timestamp,
    } = body;

    // Basic validation
    if (
      !deviceId ||
      !eventType ||
      !severity ||
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return NextResponse.json(
        {
          error: "Missing or invalid emergency data",
        },
        { status: 400 }
      );
    }

    // Search hospitals using the SAME Overpass-based
    // hospital search used by MediLocate.
    const hospitals = await findNearbyHospitals(
      latitude,
      longitude,
      EMERGENCY_RADIUS_KM
    );

    // Calculate distance from emergency location
    // to every hospital.
    const hospitalsWithDistance = hospitals
      .map((hospital) => {
        if (
          typeof hospital.lat !== "number" ||
          typeof hospital.lon !== "number"
        ) {
          return null;
        }

        return {
          ...hospital,
          distanceKm: calculateDistanceKm(
            latitude,
            longitude,
            hospital.lat,
            hospital.lon
          ),
        };
      })
      .filter((hospital) => hospital !== null)
      .sort(
        (a, b) => a.distanceKm - b.distanceKm
      );

    const nearestHospital =
      hospitalsWithDistance.length > 0
        ? hospitalsWithDistance[0]
        : null;

    const emergencyEvent: EmergencyEvent = {
      id: crypto.randomUUID(),
      deviceId,
      eventType,
      severity,
      latitude,
      longitude,
      sensorData,
      timestamp: timestamp || new Date().toISOString(),
      hospitals: hospitalsWithDistance,
      nearestHospital,
    };

    // Store the latest event temporarily.
    globalForEmergency.__latestEmergency = emergencyEvent;

    return NextResponse.json({
      status: "emergency_received",
      emergencyId: emergencyEvent.id,
      radiusKm: EMERGENCY_RADIUS_KM,
      hospitalCount: hospitalsWithDistance.length,
      nearestHospital,
    });
  } catch (error) {
    console.error("Emergency API Error:", error);

    return NextResponse.json(
      {
        error: "Failed to process emergency event",
      },
      { status: 500 }
    );
  }
}