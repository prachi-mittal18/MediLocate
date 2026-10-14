
import { NextRequest, NextResponse } from "next/server";

type NominatimItem = {
  place_id?: number;
  osm_type?: string;
  osm_id?: number;
  display_name?: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
};

type GeocodedLocation = {
  placeId?: number;
  osmType?: string;
  osmId?: number;
  displayName: string;
  lat: number;
  lon: number;
  address?: Record<string, string>;
};

const CACHE_TTL_MS = 10 * 60 * 1000;
const EMPTY_CACHE_TTL_MS = 2 * 60 * 1000;
const MIN_REQUEST_INTERVAL_MS = 1100;

const cache = new Map<
  string,
  {
    expiresAt: number;
    locations: GeocodedLocation[];
  }
>();

let lastRequestAt = 0;
let requestQueue: Promise<void> = Promise.resolve();

export async function GET(request: NextRequest) {
  const query = (
    request.nextUrl.searchParams.get("q") || ""
  ).trim();

  if (query.length < 3) {
    return NextResponse.json(
      { error: "Enter a location with at least 3 characters." },
      { status: 400 }
    );
  }

  const cacheKey = query.toLowerCase();
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({
      success: true,
      locations: cached.locations,
      cached: true,
    });
  }

  try {
    const task = requestQueue.then(async () => {
      const waitMs =
        MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt);

      if (lastRequestAt > 0 && waitMs > 0) {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, waitMs)
        );
      }

      lastRequestAt = Date.now();

      const url = new URL(
        "https://nominatim.openstreetmap.org/search"
      );

      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("q", query);
      url.searchParams.set("limit", "5");
      url.searchParams.set("addressdetails", "1");

      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent": "MediLocate-MCA-Project/1.0",
          "Accept-Language": "en",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Nominatim returned HTTP ${response.status}`
        );
      }

      const items =
        (await response.json()) as NominatimItem[];

      if (!Array.isArray(items)) {
        throw new Error("Invalid geocoding response");
      }

      const locations = items
        .map((item): GeocodedLocation | null => {
          const lat = Number(item.lat);
          const lon = Number(item.lon);

          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lon) ||
            lat < -90 ||
            lat > 90 ||
            lon < -180 ||
            lon > 180 ||
            !item.display_name
          ) {
            return null;
          }

          return {
            placeId: item.place_id,
            osmType: item.osm_type,
            osmId: item.osm_id,
            displayName: item.display_name,
            lat,
            lon,
            address: item.address,
          };
        })
        .filter(
          (item): item is GeocodedLocation => item !== null
        );

      cache.set(cacheKey, {
        expiresAt:
          Date.now() +
          (locations.length > 0
            ? CACHE_TTL_MS
            : EMPTY_CACHE_TTL_MS),
        locations,
      });

      // Keep the in-memory cache bounded.
      while (cache.size > 100) {
        const oldestKey = cache.keys().next().value;

        if (oldestKey === undefined) break;
        cache.delete(oldestKey);
      }

      return locations;
    });

    // Queue requests to respect the public service's
    // minimum request interval within this server process.
    requestQueue = task.then(
      () => undefined,
      () => undefined
    );

    const locations = await task;

    return NextResponse.json({
      success: true,
      locations,
      cached: false,
    });
  } catch (error) {
    console.error("Geocoding Error:", error);

    return NextResponse.json(
      {
        error:
          "Location lookup failed. Please try again in a moment.",
      },
      { status: 502 }
    );
  }
}
