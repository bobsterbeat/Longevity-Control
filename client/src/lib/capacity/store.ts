// ─── Types ───────────────────────────────────────────────────────────────────

/** Supported test IDs */
export type CapacityMetricId =
  | "vo2max"
  | "grip-strength"   // kg (preferred) or lb — see unit field
  | "dead-hang"       // seconds — alternative grip proxy
  | "sit-to-stand"    // reps in 30 seconds
  | "step-test"       // steps in 60 seconds
  | "balance";        // seconds single-leg stand

export interface CapacityResult {
  id: string;
  metricId: CapacityMetricId;
  dateISO: string;     // YYYY-MM-DD
  value: number;
  unit: string;
  source: "manual" | "wearable";
  notes?: string;
}

export interface UserProfile {
  age: number;
  sex: "male" | "female";
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const RESULTS_KEY = "lcp_capacity_results";
const PROFILE_KEY = "lcp_capacity_profile";
const SEED_KEY    = "lcp_capacity_seed_v1";

// ─── Profile ─────────────────────────────────────────────────────────────────

export const DEFAULT_PROFILE: UserProfile = { age: 45, sex: "male" };

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw) as UserProfile;
  } catch { /* ignore */ }
  return DEFAULT_PROFILE;
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

function loadAll(): CapacityResult[] {
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    return raw ? (JSON.parse(raw) as CapacityResult[]) : [];
  } catch {
    return [];
  }
}

function saveAll(results: CapacityResult[]): void {
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
}

export function getAllCapacityResults(): CapacityResult[] {
  return loadAll().sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}

export function getResultsForMetric(metricId: CapacityMetricId): CapacityResult[] {
  return loadAll()
    .filter((r) => r.metricId === metricId)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}

export function getLatestCapacityResults(): Record<string, CapacityResult> {
  const all = loadAll();
  const latest: Record<string, CapacityResult> = {};
  for (const r of all) {
    if (!latest[r.metricId] || r.dateISO > latest[r.metricId].dateISO) {
      latest[r.metricId] = r;
    }
  }
  return latest;
}

export function addCapacityResult(result: Omit<CapacityResult, "id">): CapacityResult {
  const all = loadAll();
  const newResult: CapacityResult = { ...result, id: crypto.randomUUID() };
  all.push(newResult);
  saveAll(all);
  return newResult;
}

export function deleteCapacityResult(id: string): void {
  saveAll(loadAll().filter((r) => r.id !== id));
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED: Omit<CapacityResult, "id">[] = [
  // VO2max — gradual improvement (mL/kg/min)
  { metricId: "vo2max", dateISO: "2025-02-01", value: 36, unit: "mL/kg/min", source: "wearable", notes: "Garmin estimate" },
  { metricId: "vo2max", dateISO: "2025-05-01", value: 38, unit: "mL/kg/min", source: "wearable" },
  { metricId: "vo2max", dateISO: "2025-08-01", value: 40, unit: "mL/kg/min", source: "wearable" },
  { metricId: "vo2max", dateISO: "2025-11-01", value: 41, unit: "mL/kg/min", source: "wearable" },
  { metricId: "vo2max", dateISO: "2026-01-15", value: 42, unit: "mL/kg/min", source: "wearable" },

  // Grip strength — improvement (kg)
  { metricId: "grip-strength", dateISO: "2025-02-01", value: 31, unit: "kg", source: "manual" },
  { metricId: "grip-strength", dateISO: "2025-05-01", value: 33, unit: "kg", source: "manual" },
  { metricId: "grip-strength", dateISO: "2025-08-01", value: 35, unit: "kg", source: "manual" },
  { metricId: "grip-strength", dateISO: "2025-11-01", value: 37, unit: "kg", source: "manual" },
  { metricId: "grip-strength", dateISO: "2026-01-15", value: 38, unit: "kg", source: "manual" },

  // Sit-to-Stand — reps in 30s
  { metricId: "sit-to-stand", dateISO: "2025-02-01", value: 12, unit: "reps", source: "manual" },
  { metricId: "sit-to-stand", dateISO: "2025-05-01", value: 14, unit: "reps", source: "manual" },
  { metricId: "sit-to-stand", dateISO: "2025-08-01", value: 15, unit: "reps", source: "manual" },
  { metricId: "sit-to-stand", dateISO: "2025-11-01", value: 16, unit: "reps", source: "manual" },
  { metricId: "sit-to-stand", dateISO: "2026-01-15", value: 17, unit: "reps", source: "manual" },

  // Step Test — steps in 60s
  { metricId: "step-test", dateISO: "2025-02-01", value: 72, unit: "steps", source: "manual" },
  { metricId: "step-test", dateISO: "2025-05-01", value: 80, unit: "steps", source: "manual" },
  { metricId: "step-test", dateISO: "2025-08-01", value: 88, unit: "steps", source: "manual" },
  { metricId: "step-test", dateISO: "2025-11-01", value: 93, unit: "steps", source: "manual" },
  { metricId: "step-test", dateISO: "2026-01-15", value: 98, unit: "steps", source: "manual" },

  // Balance — single-leg stand, seconds
  { metricId: "balance", dateISO: "2025-02-01", value: 12, unit: "s", source: "manual" },
  { metricId: "balance", dateISO: "2025-05-01", value: 18, unit: "s", source: "manual" },
  { metricId: "balance", dateISO: "2025-08-01", value: 26, unit: "s", source: "manual" },
  { metricId: "balance", dateISO: "2025-11-01", value: 33, unit: "s", source: "manual" },
  { metricId: "balance", dateISO: "2026-01-15", value: 38, unit: "s", source: "manual" },
];

export function seedCapacityIfEmpty(): void {
  if (localStorage.getItem(SEED_KEY)) return;
  const existing = loadAll();
  if (existing.length > 0) {
    localStorage.setItem(SEED_KEY, "1");
    return;
  }
  for (const entry of SEED) {
    addCapacityResult(entry);
  }
  localStorage.setItem(SEED_KEY, "1");
}
