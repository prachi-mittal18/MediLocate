/**
 * Hospital Service — all hospital-related business logic.
 */

import connectDB from "@/lib/db";
import HospitalModel from "@/models/Hospital";
import { distanceKm, googleMapsUrl } from "@/utils/geo";
import type { HospitalSearchResult } from "@/types/hospital";

/**
 * Fetch every hospital in the database.
 */
export async function getAllHospitals() {
  await connectDB();
  return HospitalModel.find({}).lean();
}

/**
 * Find hospitals near a given point using MongoDB's $near geospatial query.
 * This logic was previously a static method on the Hospital model.
 */
export async function getNearbyHospitals(
  userLat: number,
  userLng: number,
  radiusKm: number
) {
  await connectDB();
  return HospitalModel.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [userLng, userLat], // MongoDB expects [lng, lat]
        },
        $maxDistance: radiusKm * 1000,
      },
    },
  });
}

/**
 * Search nearby hospitals and enrich each result with distance and
 * a Google Maps directions URL.
 */
export async function searchWithDistance(
  latitude: number,
  longitude: number,
  radius: number
): Promise<HospitalSearchResult[]> {
  const hospitals = await getNearbyHospitals(latitude, longitude, radius);

  return hospitals.map((hospital: any) => {
    const [hLng, hLat] = hospital.location.coordinates;
    return {
      id: hospital._id,
      name: hospital.name,
      address: hospital.address,
      phone: hospital.phone,
      ambulance_phone: hospital.ambulance_phone,
      available_beds: hospital.available_beds,
      latitude: hLat,
      longitude: hLng,
      distance_km: distanceKm(latitude, longitude, hLat, hLng),
      googleMapsUrl: googleMapsUrl(hLat, hLng),
    };
  });
}
