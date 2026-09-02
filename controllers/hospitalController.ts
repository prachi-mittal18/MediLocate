/**
 * Hospital Controller — request parsing, service delegation, response formatting.
 */

import { NextRequest, NextResponse } from "next/server";
import * as hospitalService from "@/services/hospitalService";

/**
 * Handle GET /api/hospitals — return all hospitals.
 */
export async function handleGetAllHospitals() {
  try {
    const hospitals = await hospitalService.getAllHospitals();

    return NextResponse.json({ ok: true, hospitals });
  } catch (error: any) {
    console.error("❌ Hospital Controller Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to fetch hospitals" },
      { status: 500 }
    );
  }
}

/**
 * Handle GET /api/hospitals/search — find nearby hospitals.
 */
export async function handleSearchHospitals(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const latitude = parseFloat(searchParams.get("latitude") || "0");
    const longitude = parseFloat(searchParams.get("longitude") || "0");
    const radius = parseFloat(searchParams.get("radius") || "5");

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    const hospitals = await hospitalService.searchWithDistance(
      latitude,
      longitude,
      radius
    );

    return NextResponse.json({
      status: "success",
      count: hospitals.length,
      hospitals,
    });
  } catch (error: any) {
    console.error("❌ Hospital Search Error:", error);
    return NextResponse.json(
      { error: "Search failed", details: error.message },
      { status: 500 }
    );
  }
}
