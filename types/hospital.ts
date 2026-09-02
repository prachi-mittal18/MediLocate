/**
 * Shared types for the Hospital domain.
 */

/** GeoJSON Point stored in MongoDB */
export interface GeoPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

/** Raw hospital document shape (matches Mongoose schema) */
export interface IHospital {
  _id: string;
  name: string;
  location: GeoPoint;
  address: string;
  phone?: string;
  ambulance_phone?: string;
  website_url?: string;
  available_beds: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Query parameters for the nearby-hospital search endpoint */
export interface HospitalSearchParams {
  latitude: number;
  longitude: number;
  radius: number; // km
}

/** A hospital enriched with distance + directions link (returned by search) */
export interface HospitalSearchResult {
  id: string;
  name: string;
  address: string;
  phone?: string;
  ambulance_phone?: string;
  available_beds: number;
  latitude: number;
  longitude: number;
  distance_km: number;
  googleMapsUrl: string;
}

/** Standard API response wrapper */
export interface HospitalListResponse {
  ok: boolean;
  hospitals: IHospital[];
  error?: string;
}

export interface HospitalSearchResponse {
  status: string;
  count: number;
  hospitals: HospitalSearchResult[];
}
