export type Hospital = {
  id: number;
  lat: number;
  lon: number;
  tags?: {
    name?: string;
    [key: string]: unknown;
  };
};

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

const REQUEST_TIMEOUT_MS = 15000;

export async function findNearbyHospitals(
  latitude: number,
  longitude: number,
  radiusKm: number
): Promise<Hospital[]> {
  const radiusMeters = radiusKm * 1000;

  /*
   * Search hospitals around the user's location.
   *
   * We deliberately search nodes, ways and relations because
   * a hospital in OpenStreetMap is not necessarily represented
   * only as a single node.
   */
  const query = `
    [out:json][timeout:12];
    (
      node["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
      relation["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
    );
    out center tags;
  `;

  let lastError: unknown = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      console.log(`Trying Overpass endpoint: ${endpoint}`);

      const controller = new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "MediLocate-MCA-Project/1.0",
            Accept: "application/json",
          },
          body: `data=${encodeURIComponent(query)}`,
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();

          throw new Error(
            `Overpass ${response.status}: ${errorText.slice(0, 500)}`
          );
        }

        const data = await response.json();

        const elements = Array.isArray(data.elements)
          ? data.elements
          : [];

        /*
         * Ways and relations return their coordinates under
         * "center". Normalize them to the same lat/lon structure
         * used by the Leaflet map.
         */
        const hospitals: Hospital[] = elements
          .map((element: any) => {
            let lat = element.lat;
            let lon = element.lon;

            if (
              (lat === undefined || lon === undefined) &&
              element.center
            ) {
              lat = element.center.lat;
              lon = element.center.lon;
            }

            if (
              typeof lat !== "number" ||
              typeof lon !== "number"
            ) {
              return null;
            }

            return {
              id: element.id,
              lat,
              lon,
              tags: element.tags || {},
            };
          })
          .filter(Boolean) as Hospital[];

        console.log(
          `Overpass success: ${hospitals.length} hospitals found`
        );

        return hospitals;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      lastError = error;

      console.error(
        `Overpass endpoint failed: ${endpoint}`,
        error
      );

      /*
       * Try the next Overpass server instead of immediately
       * failing the entire hospital search.
       */
    }
  }

  throw new Error(
    `All Overpass endpoints failed. Last error: ${
      lastError instanceof Error
        ? lastError.message
        : String(lastError)
    }`
  );
}

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}