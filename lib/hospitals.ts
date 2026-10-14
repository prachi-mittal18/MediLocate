

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


const EXACT_NAME_RADIUS_M = 100;
const SIMILAR_NAME_RADIUS_M = 75;
const SAME_WEBSITE_RADIUS_M = 400;
const NAME_SIMILARITY_THRESHOLD = 0.82;

function normalizeHospitalName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getHospitalNameVariants(hospital: Hospital): string[] {
  const keys = [
    "name",
    "name:en",
    "official_name",
    "alt_name",
    "loc_name",
    "short_name",
  ];

  const names = keys
    .map((key) => hospital.tags?.[key])
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim() !== ""
    )
    .map(normalizeHospitalName)
    .filter(Boolean);

  return [...new Set(names)];
}

function getBaseHospitalName(value: string): string {
  const genericWords = new Set([
    "and",
    "center",
    "centre",
    "general",
    "hospital",
    "hospitals",
    "research",
    "the",
  ]);

  return normalizeHospitalName(value)
    .split(" ")
    .filter((word) => !genericWords.has(word))
    .join(" ");
}

function getHospitalWebsiteHost(hospital: Hospital): string {
  const value =
    hospital.tags?.website ??
    hospital.tags?.["contact:website"];

  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  try {
    const website = value.trim();

    const url = new URL(
      /^https?:\/\//i.test(website)
        ? website
        : `https://${website}`
    );

    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function getNameSimilarity(a: string, b: string): number {
  if (a === b) return 1;

  const longest = Math.max(a.length, b.length);

  if (longest === 0) return 1;

  let previous = Array.from(
    { length: b.length + 1 },
    (_, index) => index
  );

  for (let i = 1; i <= a.length; i++) {
    const current = [i];

    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }

    previous = current;
  }

  return 1 - previous[b.length] / longest;
}

function areLikelyDuplicateHospitals(
  a: Hospital,
  b: Hospital
): boolean {
  const distanceM =
    calculateDistanceKm(a.lat, a.lon, b.lat, b.lon) * 1000;

  const namesA = getHospitalNameVariants(a);
  const namesB = getHospitalNameVariants(b);

  if (namesA.length === 0 || namesB.length === 0) {
    return false;
  }

  if (
    distanceM <= EXACT_NAME_RADIUS_M &&
    namesA.some((name) => namesB.includes(name))
  ) {
    return true;
  }

  if (
    distanceM <= EXACT_NAME_RADIUS_M &&
    namesA.some((nameA) =>
      namesB.some(
        (nameB) =>
          getBaseHospitalName(nameA) ===
            getBaseHospitalName(nameB) &&
          getBaseHospitalName(nameA) !== ""
      )
    )
  ) {
    return true;
  }

  if (
    distanceM <= SIMILAR_NAME_RADIUS_M &&
    namesA.some((nameA) =>
      namesB.some(
        (nameB) =>
          getNameSimilarity(nameA, nameB) >=
          NAME_SIMILARITY_THRESHOLD
      )
    )
  ) {
    return true;
  }

  const websiteA = getHospitalWebsiteHost(a);
  const websiteB = getHospitalWebsiteHost(b);

  if (
    websiteA !== "" &&
    websiteA === websiteB &&
    distanceM <= SAME_WEBSITE_RADIUS_M
  ) {
    return namesA.some((nameA) =>
      namesB.some(
        (nameB) =>
          getBaseHospitalName(nameA) !== "" &&
          getBaseHospitalName(nameA) ===
            getBaseHospitalName(nameB)
      )
    );
  }

  return false;
}

function deduplicateHospitals(
  hospitals: Hospital[],
  searchLatitude: number,
  searchLongitude: number
): Hospital[] {
  const ordered = [...hospitals].sort(
    (a, b) =>
      calculateDistanceKm(
        searchLatitude,
        searchLongitude,
        a.lat,
        a.lon
      ) -
      calculateDistanceKm(
        searchLatitude,
        searchLongitude,
        b.lat,
        b.lon
      )
  );

  const groups: Hospital[][] = [];

  for (const candidate of ordered) {
    const matchingGroups: number[] = [];

    groups.forEach((group, index) => {
      if (
        group.some((existing) =>
          areLikelyDuplicateHospitals(existing, candidate)
        )
      ) {
        matchingGroups.push(index);
      }
    });

    if (matchingGroups.length === 0) {
      groups.push([candidate]);
      continue;
    }

    const primaryIndex = matchingGroups[0];
    groups[primaryIndex].push(candidate);

    for (const index of matchingGroups.slice(1).reverse()) {
      groups[primaryIndex].push(...groups[index]);
      groups.splice(index, 1);
    }
  }

  return groups.map((group) => {
    const representative = group[0];

    const mergedTags = Object.assign(
      {},
      ...group.slice(1).map((hospital) => hospital.tags ?? {}),
      representative.tags ?? {}
    );

    return {
      ...representative,
      tags: mergedTags,
    };
  });
}


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

        const uniqueHospitals = deduplicateHospitals(
  hospitals,
  latitude,
  longitude
);

console.log(
  `Overpass success: ${hospitals.length} OSM records, ` +
    `${uniqueHospitals.length} unique hospital candidates after deduplication`
);

return uniqueHospitals;
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