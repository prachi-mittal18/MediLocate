
export type HospitalRankingMode =
  | "distance-only"
  | "vesit-demo";

  type HospitalRankingContext = "normal" | "emergency";

export type HospitalReviewSummary = {
  hospitalName: string;
  averageRating: number;
  reviewCount: number;
  sentimentScore: number;
  sentimentLabel: "Positive" | "Neutral" | "Negative";
};

type RankableHospital = {
  name?: string;
  lat?: number;
  lon?: number;
  distanceKm?: number;
  tags?: {
    name?: string;
    [key: string]: unknown;
  };
  [key: string]: any;
};

export type RankedHospital<T> = T & {
  hasSimulatedDemoData: boolean;
  demoRating: number | null;
  demoReviewCount: number;
  demoSentimentScore: number | null;
  demoSentimentLabel:
    | "Positive"
    | "Neutral"
    | "Negative"
    | "No demo data";
  recommendationScore: number | null;
  rankingBasis: "distance-only" | "distance+demo-reviews";
};

export type HospitalRankingResult<T> = {
  mode: HospitalRankingMode;
  isWithinDemoArea: boolean;
  matchedHospitalCount: number;
  hospitals: RankedHospital<T>[];
};

type ReviewGroup = {
  hospitalName: string;
  aliases: Set<string>;
  ratings: number[];
  sentimentScores: number[];
};

// VESIT reference point used for the demo region.
// The 2 km limit is a configurable project choice,
// not the official boundary of the campus.
const VESIT_LATITUDE = 19.046222;
const VESIT_LONGITUDE = 72.889849;
const VESIT_DEMO_RADIUS_KM = 2;

const positiveWords = new Set([
  "helpful",
  "friendly",
  "good",
  "clear",
  "short",
  "excellent",
  "clean",
  "professional",
  "kind",
  "efficient",
  "supportive",
  "pleasant",
  "comfortable",
  "respectful",
  "quick",
]);

const negativeWords = new Set([
  "long",
  "longer",
  "poor",
  "unclear",
  "unhelpful",
  "frustrating",
  "rude",
  "dirty",
  "slow",
  "bad",
  "confusing",
  "delayed",
  "delay",
  "unpleasant",
  "stressful",
  "crowded",
  "disappointing",
  "careless",
]);

let cachedReviewPromise: Promise<
  Map<string, HospitalReviewSummary>
> | null = null;

function normalizeHospitalName(value: string): string {
  let name = value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\./g, "")
    .replace(/\bthe\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  // Make common location suffixes less likely to prevent a match.
  while (/\s+(mumbai|chembur)$/.test(name)) {
    name = name
      .replace(/\s+(mumbai|chembur)$/, "")
      .trim();
  }

  return name;
}

function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadiusKm = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const boundedA = Math.min(1, Math.max(0, a));

  return (
    2 *
    earthRadiusKm *
    Math.atan2(
      Math.sqrt(boundedA),
      Math.sqrt(1 - boundedA)
    )
  );
}

function isValidCoordinates(
  latitude: number,
  longitude: number
): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function isWithinVesitDemoArea(
  latitude: number,
  longitude: number
): boolean {
  if (!isValidCoordinates(latitude, longitude)) {
    return false;
  }

  const distanceFromVesit = calculateDistanceKm(
    VESIT_LATITUDE,
    VESIT_LONGITUDE,
    latitude,
    longitude
  );

  return distanceFromVesit <= VESIT_DEMO_RADIUS_KM;
}

function getHospitalDistance(
  hospital: RankableHospital,
  searchLatitude: number,
  searchLongitude: number
): number {
  if (
    typeof hospital.distanceKm === "number" &&
    Number.isFinite(hospital.distanceKm) &&
    hospital.distanceKm >= 0
  ) {
    return hospital.distanceKm;
  }

  if (
    typeof hospital.lat === "number" &&
    typeof hospital.lon === "number" &&
    isValidCoordinates(hospital.lat, hospital.lon)
  ) {
    return calculateDistanceKm(
      searchLatitude,
      searchLongitude,
      hospital.lat,
      hospital.lon
    );
  }

  return Number.POSITIVE_INFINITY;
}

/**
 * Supports quoted fields and commas inside review text.
 * No additional CSV parsing package is required.
 */
function parseCsv(csv: string): Record<string, string>[] {
  const text = csv.replace(/^\uFEFF/, "");
  const rows: string[][] = [];

  let row: string[] = [];
  let field = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (insideQuotes && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      row.push(field);
      field = "";
    } else if (
      (char === "\n" || char === "\r") &&
      !insideQuotes
    ) {
      if (char === "\r" && text[i + 1] === "\n") {
        i++;
      }

      row.push(field);

      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }

      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);

    if (row.some((cell) => cell.trim() !== "")) {
      rows.push(row);
    }
  }

  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim());

  return rows.slice(1).map((values) => {
    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      record[header] = (values[index] ?? "").trim();
    });

    return record;
  });
}

/**
 * Simple rule-based sentiment score:
 * -1 = negative, 0 = neutral, +1 = positive.
 *
 * This is a demonstration algorithm, not a clinical
 * assessment or a sophisticated language model.
 */
function calculateSentiment(reviewText: string): number {
  const cleanText = reviewText
    .replace(/^\[.*?\]\s*/, "")
    .toLowerCase();

  const words = cleanText.match(/[a-z]+/g) ?? [];

  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of words) {
    if (positiveWords.has(word)) positiveCount++;
    if (negativeWords.has(word)) negativeCount++;
  }

  const matchedCount = positiveCount + negativeCount;

  if (matchedCount === 0) {
    return 0;
  }

  return (
    (positiveCount - negativeCount) / matchedCount
  );
}

function labelSentiment(
  score: number
): "Positive" | "Neutral" | "Negative" {
  if (score > 0.15) return "Positive";
  if (score < -0.15) return "Negative";

  return "Neutral";
}

async function loadReviewSummaries(): Promise<
  Map<string, HospitalReviewSummary>
> {
  if (!cachedReviewPromise) {
    cachedReviewPromise = (async () => {
      const response = await fetch(
        "/data/medilocate_vesit_hospital_demo_reviews.csv",
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(
          `Could not load demo-review CSV: HTTP ${response.status}. ` +
            "Check the file under public/data."
        );
      }

      const csv = await response.text();
      const records = parseCsv(csv);
      const groups = new Map<string, ReviewGroup>();

      for (const record of records) {
        // Only the prepared synthetic test records are eligible.
        if (record.data_type !== "simulated_demo") {
          continue;
        }

        const hospitalName = record.hospital_name ?? "";
        const normalizedName =
          normalizeHospitalName(hospitalName);

        const rating = Number(record.rating);
        const reviewText = record.review_text ?? "";

        if (
          !normalizedName ||
          !Number.isFinite(rating) ||
          rating < 1 ||
          rating > 5 ||
          !reviewText
        ) {
          continue;
        }

        let group = groups.get(normalizedName);

        if (!group) {
          group = {
            hospitalName,
            aliases: new Set<string>(),
            ratings: [],
            sentimentScores: [],
          };

          groups.set(normalizedName, group);
        }

        group.ratings.push(rating);
        group.sentimentScores.push(
          calculateSentiment(reviewText)
        );
        group.aliases.add(hospitalName);

        const aliases = (
          record.hospital_aliases ?? ""
        )
          .split(/[;|]/)
          .map((alias) => alias.trim())
          .filter(Boolean);

        for (const alias of aliases) {
          group.aliases.add(alias);
        }
      }

      const summaries = new Map<
        string,
        HospitalReviewSummary
      >();

      for (const group of groups.values()) {
        const averageRating =
          group.ratings.reduce(
            (total, rating) => total + rating,
            0
          ) / group.ratings.length;

        const sentimentScore =
          group.sentimentScores.reduce(
            (total, score) => total + score,
            0
          ) / group.sentimentScores.length;

        const summary: HospitalReviewSummary = {
          hospitalName: group.hospitalName,
          averageRating:
            Math.round(averageRating * 100) / 100,
          reviewCount: group.ratings.length,
          sentimentScore:
            Math.round(sentimentScore * 1000) / 1000,
          sentimentLabel: labelSentiment(sentimentScore),
        };

        for (const alias of group.aliases) {
          const key = normalizeHospitalName(alias);

          if (key) {
            summaries.set(key, summary);
          }
        }
      }

      console.log(
        `Loaded ${records.length} CSV rows and prepared ` +
          `${summaries.size} hospital-name/alias lookup keys.`
      );

      return summaries;
    })().catch((error) => {
      // Permit retry on a future search if loading failed.
      cachedReviewPromise = null;
      throw error;
    });
  }

  return cachedReviewPromise;
}

function sortByDistance<T extends RankableHospital>(
  hospitals: T[],
  searchLatitude: number,
  searchLongitude: number
): RankedHospital<T>[] {
  return hospitals
    .map((hospital, originalIndex) => ({
      hospital,
      originalIndex,
      distance: getHospitalDistance(
        hospital,
        searchLatitude,
        searchLongitude
      ),
    }))
    .sort(
      (a, b) =>
        a.distance - b.distance ||
        a.originalIndex - b.originalIndex
    )
    .map(({ hospital }) => ({
      ...hospital,
      hasSimulatedDemoData: false,
      demoRating: null,
      demoReviewCount: 0,
      demoSentimentScore: null,
      demoSentimentLabel: "No demo data" as const,
      recommendationScore: null,
      rankingBasis: "distance-only" as const,
    }));
}

/**
 * Ranking rules:
 *
 * Outside the VESIT demo area:
 *   Sort by distance; do not load or use the CSV.
 *
 * Inside the demo area, with no matching summaries:
 *   Sort by distance and hide review data.
 *
 * Inside the demo area, with matches:
 *   Matched hospitals: distance 50%, rating 30%, sentiment 20%.
 *   Unmatched hospitals: normalized distance-only score.
 *
 * Search coordinates must be supplied by the caller.
 */
export async function rankHospitalsWithDemoReviews<
  T extends RankableHospital
>(
  hospitals: T[],
  searchLatitude: number,
  searchLongitude: number,
  rankingContext: HospitalRankingContext = "normal"
): Promise<HospitalRankingResult<T>> {
  const withinDemoArea = isWithinVesitDemoArea(
    searchLatitude,
    searchLongitude
  );

  // Do not read the VESIT dataset for other search locations.
  if (!withinDemoArea) {
    return {
      mode: "distance-only",
      isWithinDemoArea: false,
      matchedHospitalCount: 0,
      hospitals: sortByDistance(
        hospitals,
        searchLatitude,
        searchLongitude
      ),
    };
  }

  let summaries: Map<string, HospitalReviewSummary>;

  try {
    summaries = await loadReviewSummaries();
  } catch (error) {
    console.error(
      "Demo-review CSV unavailable; using distance-only ranking.",
      error
    );

    return {
      mode: "distance-only",
      isWithinDemoArea: true,
      matchedHospitalCount: 0,
      hospitals: sortByDistance(
        hospitals,
        searchLatitude,
        searchLongitude
      ),
    };
  }

  const matches = hospitals.map((hospital) => {
    const possibleNames = [
      hospital.name ?? "",
      hospital.tags?.name ?? "",
    ];

    let summary: HospitalReviewSummary | undefined;

    for (const name of possibleNames) {
      const key = normalizeHospitalName(name);

      if (key && summaries.has(key)) {
        summary = summaries.get(key);
        break;
      }
    }

    return { hospital, summary };
  });

  const matchedHospitalCount = matches.filter(
    (item) => item.summary !== undefined
  ).length;

  // No hospital in this result set matched the CSV.
  if (matchedHospitalCount === 0) {
    return {
      mode: "distance-only",
      isWithinDemoArea: true,
      matchedHospitalCount: 0,
      hospitals: sortByDistance(
        hospitals,
        searchLatitude,
        searchLongitude
      ),
    };
  }

  const distances = hospitals.map((hospital) =>
    getHospitalDistance(
      hospital,
      searchLatitude,
      searchLongitude
    )
  );

  const validDistances = distances.filter(Number.isFinite);
  const maxDistanceKm = Math.max(0, ...validDistances);
  const weights =
  rankingContext === "emergency"
    ? {
        distance: 0.7,
        rating: 0.2,
        sentiment: 0.1,
      }
    : {
        distance: 0.5,
        rating: 0.3,
        sentiment: 0.2,
      };

  const ranked = matches.map(
    ({ hospital, summary }, originalIndex) => {
      const distanceKm = distances[originalIndex];

      const distanceScore = !Number.isFinite(distanceKm)
        ? 0
        : maxDistanceKm === 0
          ? 100
          : Math.max(
              0,
              Math.min(
                100,
                (1 - distanceKm / maxDistanceKm) * 100
              )
            );

      let recommendationScore: number;
      let rankingBasis:
        | "distance-only"
        | "distance+demo-reviews";

      if (summary) {
        const ratingScore =
          ((summary.averageRating - 1) / 4) * 100;

        const sentimentScore =
          ((summary.sentimentScore + 1) / 2) * 100;

        recommendationScore =
  distanceScore * weights.distance +
  ratingScore * weights.rating +
  sentimentScore * weights.sentiment;

        rankingBasis = "distance+demo-reviews";
      } else {
  const neutralRatingScore = 50;
  const neutralSentimentScore = 50;

  recommendationScore =
  distanceScore * weights.distance +
  neutralRatingScore * weights.rating +
  neutralSentimentScore * weights.sentiment;

  rankingBasis = "distance-only";
}

      return {
        hospital: {
          ...hospital,
          hasSimulatedDemoData: Boolean(summary),
          demoRating: summary?.averageRating ?? null,
          demoReviewCount: summary?.reviewCount ?? 0,
          demoSentimentScore:
            summary?.sentimentScore ?? null,
          demoSentimentLabel:
            summary?.sentimentLabel ?? "No demo data",
          recommendationScore:
            Math.round(recommendationScore * 10) / 10,
          rankingBasis,
        } as RankedHospital<T>,
        distanceKm,
        originalIndex,
      };
    }
  );

  ranked.sort((a, b) => {
    const scoreDifference =
      (b.hospital.recommendationScore ?? 0) -
      (a.hospital.recommendationScore ?? 0);

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    return (
      a.distanceKm - b.distanceKm ||
      a.originalIndex - b.originalIndex
    );
  });

  return {
    mode: "vesit-demo",
    isWithinDemoArea: true,
    matchedHospitalCount,
    hospitals: ranked.map((item) => item.hospital),
  };
}
