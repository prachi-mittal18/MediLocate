import { NextRequest, NextResponse } from "next/server";
import {
  findNearbyHospitals,
  calculateDistanceKm,
} from "@/lib/hospitals";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const latitude = parseFloat(searchParams.get("latitude") || "0");
    const longitude = parseFloat(searchParams.get("longitude") || "0");
    const radius = parseFloat(searchParams.get("radius") || "5");

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(radius) ||
      radius <= 0 ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: "Invalid coordinates or radius" },
        { status: 400 }
      );
    }

    const hospitals = await findNearbyHospitals(
      latitude,
      longitude,
      radius
    );

    const hospitalsWithUrls = hospitals.map((hospital) => ({
      ...hospital,

      name: hospital.tags?.name || "Unnamed Hospital",

      latitude: hospital.lat,
      longitude: hospital.lon,

      distanceKm: calculateDistanceKm(
        latitude,
        longitude,
        hospital.lat,
        hospital.lon
      ),

      googleMapsUrl:
        `https://www.google.com/maps/search/?api=1&query=` +
        `${encodeURIComponent(
          `${hospital.lat},${hospital.lon}`
        )}`,
    }));

    hospitalsWithUrls.sort(
      (a, b) => a.distanceKm - b.distanceKm
    );

    return NextResponse.json({
      status: "success",
      count: hospitalsWithUrls.length,
      hospitals: hospitalsWithUrls,
    });
  } catch (error) {
    console.error("Hospital Search Error:", error);

    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}