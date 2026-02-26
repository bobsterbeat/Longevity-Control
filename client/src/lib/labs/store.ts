import { matchBiomarkerAlias } from "./biomarkers";

// ─── Schema ──────────────────────────────────────────────────────────────────

export interface LabResult {
  id: string;
  biomarkerId: string;
  dateISO: string;       // YYYY-MM-DD
  value: number;
  unit: string;
  source: "manual" | "csv" | "api";
  notes?: string;
}

const STORAGE_KEY = "lcp_lab_results";

// ─── CRUD ─────────────────────────────────────────────────────────────────────

function load(): LabResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LabResult[];
  } catch {
    return [];
  }
}

function save(results: LabResult[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

export function getAllResults(): LabResult[] {
  return load().sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}

export function getResultsForBiomarker(biomarkerId: string): LabResult[] {
  return load()
    .filter((r) => r.biomarkerId === biomarkerId)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}

export function getLatestResults(): Record<string, LabResult> {
  const all = load();
  const latest: Record<string, LabResult> = {};
  for (const r of all) {
    if (!latest[r.biomarkerId] || r.dateISO > latest[r.biomarkerId].dateISO) {
      latest[r.biomarkerId] = r;
    }
  }
  return latest;
}

export function addResult(result: Omit<LabResult, "id">): LabResult {
  const all = load();
  const newResult: LabResult = { ...result, id: crypto.randomUUID() };
  all.push(newResult);
  save(all);
  return newResult;
}

export function deleteResult(id: string): void {
  const all = load().filter((r) => r.id !== id);
  save(all);
}

export function clearAll(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── CSV Import ───────────────────────────────────────────────────────────────

export interface CsvImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

/**
 * Parse a CSV with columns: date, biomarker, value, unit, source, notes
 * (order doesn't matter — detected by header row)
 */
export function importFromCSV(csvText: string): CsvImportResult {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return { imported: 0, skipped: 0, errors: ["CSV has no data rows"] };

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const dateIdx = headers.findIndex((h) => h === "date" || h === "date_iso");
  const nameIdx = headers.findIndex((h) => h === "biomarker" || h === "test" || h === "name" || h === "marker");
  const valueIdx = headers.findIndex((h) => h === "value" || h === "result");
  const unitIdx = headers.findIndex((h) => h === "unit" || h === "units");
  const sourceIdx = headers.findIndex((h) => h === "source");
  const notesIdx = headers.findIndex((h) => h === "notes" || h === "comment");

  if (dateIdx === -1 || nameIdx === -1 || valueIdx === -1) {
    return {
      imported: 0,
      skipped: 0,
      errors: ["CSV must have columns: date, biomarker, value (and optionally: unit, source, notes)"],
    };
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols.length < 3) { skipped++; continue; }

    const dateStr = cols[dateIdx];
    const nameStr = cols[nameIdx];
    const valueStr = cols[valueIdx];
    const unit = unitIdx !== -1 ? cols[unitIdx] : "";
    const source = sourceIdx !== -1 ? (cols[sourceIdx] as LabResult["source"]) : "csv";
    const notes = notesIdx !== -1 ? cols[notesIdx] : undefined;

    if (!dateStr || !nameStr || !valueStr) { skipped++; continue; }

    const biomarker = matchBiomarkerAlias(nameStr);
    if (!biomarker) {
      errors.push(`Row ${i + 1}: unknown biomarker "${nameStr}"`);
      skipped++;
      continue;
    }

    const value = parseFloat(valueStr);
    if (isNaN(value)) {
      errors.push(`Row ${i + 1}: invalid value "${valueStr}"`);
      skipped++;
      continue;
    }

    // Validate date format loosely (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      errors.push(`Row ${i + 1}: date must be YYYY-MM-DD format, got "${dateStr}"`);
      skipped++;
      continue;
    }

    addResult({
      biomarkerId: biomarker.id,
      dateISO: dateStr,
      value,
      unit: unit || biomarker.unit,
      source: ["manual", "csv", "api"].includes(source) ? source : "csv",
      notes,
    });
    imported++;
  }

  return { imported, skipped, errors };
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

const SEED_KEY = "lcp_lab_seed_v1";

interface SeedEntry {
  biomarkerId: string;
  dateISO: string;
  value: number;
  unit: string;
}

// 5 time points across the past 12 months — showing gradual improvement
const SEED_DATA: SeedEntry[] = [
  // ── hs-CRP (lower is better, ideal <0.7)
  { biomarkerId: "hs-crp", dateISO: "2025-02-01", value: 2.1,  unit: "mg/L" },
  { biomarkerId: "hs-crp", dateISO: "2025-05-01", value: 1.7,  unit: "mg/L" },
  { biomarkerId: "hs-crp", dateISO: "2025-08-01", value: 1.3,  unit: "mg/L" },
  { biomarkerId: "hs-crp", dateISO: "2025-11-01", value: 1.0,  unit: "mg/L" },
  { biomarkerId: "hs-crp", dateISO: "2026-01-15", value: 0.82, unit: "mg/L" },

  // ── HbA1c (lower is better, ideal 5.0–5.3%)
  { biomarkerId: "hba1c", dateISO: "2025-02-01", value: 5.9, unit: "%" },
  { biomarkerId: "hba1c", dateISO: "2025-05-01", value: 5.7, unit: "%" },
  { biomarkerId: "hba1c", dateISO: "2025-08-01", value: 5.5, unit: "%" },
  { biomarkerId: "hba1c", dateISO: "2025-11-01", value: 5.4, unit: "%" },
  { biomarkerId: "hba1c", dateISO: "2026-01-15", value: 5.3, unit: "%" },

  // ── Fasting Insulin (lower is better, ideal 2–5)
  { biomarkerId: "fasting-insulin", dateISO: "2025-02-01", value: 12, unit: "µIU/mL" },
  { biomarkerId: "fasting-insulin", dateISO: "2025-05-01", value: 10, unit: "µIU/mL" },
  { biomarkerId: "fasting-insulin", dateISO: "2025-08-01", value: 8,  unit: "µIU/mL" },
  { biomarkerId: "fasting-insulin", dateISO: "2025-11-01", value: 7,  unit: "µIU/mL" },
  { biomarkerId: "fasting-insulin", dateISO: "2026-01-15", value: 6,  unit: "µIU/mL" },

  // ── Triglycerides (lower is better, ideal <100)
  { biomarkerId: "tg", dateISO: "2025-02-01", value: 165, unit: "mg/dL" },
  { biomarkerId: "tg", dateISO: "2025-05-01", value: 148, unit: "mg/dL" },
  { biomarkerId: "tg", dateISO: "2025-08-01", value: 130, unit: "mg/dL" },
  { biomarkerId: "tg", dateISO: "2025-11-01", value: 118, unit: "mg/dL" },
  { biomarkerId: "tg", dateISO: "2026-01-15", value: 108, unit: "mg/dL" },

  // ── HDL (higher is better, ideal >60)
  { biomarkerId: "hdl", dateISO: "2025-02-01", value: 42, unit: "mg/dL" },
  { biomarkerId: "hdl", dateISO: "2025-05-01", value: 46, unit: "mg/dL" },
  { biomarkerId: "hdl", dateISO: "2025-08-01", value: 50, unit: "mg/dL" },
  { biomarkerId: "hdl", dateISO: "2025-11-01", value: 54, unit: "mg/dL" },
  { biomarkerId: "hdl", dateISO: "2026-01-15", value: 57, unit: "mg/dL" },

  // ── ApoB (lower is better, ideal <80)
  { biomarkerId: "apob", dateISO: "2025-02-01", value: 115, unit: "mg/dL" },
  { biomarkerId: "apob", dateISO: "2025-05-01", value: 108, unit: "mg/dL" },
  { biomarkerId: "apob", dateISO: "2025-08-01", value: 100, unit: "mg/dL" },
  { biomarkerId: "apob", dateISO: "2025-11-01", value: 94,  unit: "mg/dL" },
  { biomarkerId: "apob", dateISO: "2026-01-15", value: 90,  unit: "mg/dL" },

  // ── Lp(a) — genetically set, minimal change
  { biomarkerId: "lpa", dateISO: "2025-02-01", value: 85, unit: "nmol/L" },
  { biomarkerId: "lpa", dateISO: "2025-08-01", value: 83, unit: "nmol/L" },
  { biomarkerId: "lpa", dateISO: "2026-01-15", value: 82, unit: "nmol/L" },

  // ── Homocysteine (lower is better, ideal <9)
  { biomarkerId: "homocysteine", dateISO: "2025-02-01", value: 14.5, unit: "µmol/L" },
  { biomarkerId: "homocysteine", dateISO: "2025-05-01", value: 13.0, unit: "µmol/L" },
  { biomarkerId: "homocysteine", dateISO: "2025-08-01", value: 11.5, unit: "µmol/L" },
  { biomarkerId: "homocysteine", dateISO: "2025-11-01", value: 10.2, unit: "µmol/L" },
  { biomarkerId: "homocysteine", dateISO: "2026-01-15", value: 9.5,  unit: "µmol/L" },

  // ── eGFR (higher is better, ideal >90)
  { biomarkerId: "egfr", dateISO: "2025-02-01", value: 85, unit: "mL/min/1.73m²" },
  { biomarkerId: "egfr", dateISO: "2025-05-01", value: 87, unit: "mL/min/1.73m²" },
  { biomarkerId: "egfr", dateISO: "2025-08-01", value: 89, unit: "mL/min/1.73m²" },
  { biomarkerId: "egfr", dateISO: "2025-11-01", value: 91, unit: "mL/min/1.73m²" },
  { biomarkerId: "egfr", dateISO: "2026-01-15", value: 92, unit: "mL/min/1.73m²" },

  // ── Creatinine (range, stable)
  { biomarkerId: "creatinine", dateISO: "2025-02-01", value: 1.02, unit: "mg/dL" },
  { biomarkerId: "creatinine", dateISO: "2025-08-01", value: 1.00, unit: "mg/dL" },
  { biomarkerId: "creatinine", dateISO: "2026-01-15", value: 0.99, unit: "mg/dL" },

  // ── ALT (lower is better, ideal <25)
  { biomarkerId: "alt", dateISO: "2025-02-01", value: 42, unit: "U/L" },
  { biomarkerId: "alt", dateISO: "2025-05-01", value: 38, unit: "U/L" },
  { biomarkerId: "alt", dateISO: "2025-08-01", value: 33, unit: "U/L" },
  { biomarkerId: "alt", dateISO: "2025-11-01", value: 29, unit: "U/L" },
  { biomarkerId: "alt", dateISO: "2026-01-15", value: 26, unit: "U/L" },

  // ── Vitamin D (range, ideal 40–70)
  { biomarkerId: "vitamin-d", dateISO: "2025-02-01", value: 22, unit: "ng/mL" },
  { biomarkerId: "vitamin-d", dateISO: "2025-05-01", value: 35, unit: "ng/mL" },
  { biomarkerId: "vitamin-d", dateISO: "2025-08-01", value: 52, unit: "ng/mL" },
  { biomarkerId: "vitamin-d", dateISO: "2025-11-01", value: 43, unit: "ng/mL" },
  { biomarkerId: "vitamin-d", dateISO: "2026-01-15", value: 46, unit: "ng/mL" },

  // ── Ferritin (range, ideal 50–100)
  { biomarkerId: "ferritin", dateISO: "2025-02-01", value: 180, unit: "ng/mL" },
  { biomarkerId: "ferritin", dateISO: "2025-05-01", value: 155, unit: "ng/mL" },
  { biomarkerId: "ferritin", dateISO: "2025-08-01", value: 135, unit: "ng/mL" },
  { biomarkerId: "ferritin", dateISO: "2025-11-01", value: 115, unit: "ng/mL" },
  { biomarkerId: "ferritin", dateISO: "2026-01-15", value: 102, unit: "ng/mL" },

  // ── Uric Acid (lower is better, ideal <5.0)
  { biomarkerId: "uric-acid", dateISO: "2025-02-01", value: 6.8, unit: "mg/dL" },
  { biomarkerId: "uric-acid", dateISO: "2025-05-01", value: 6.4, unit: "mg/dL" },
  { biomarkerId: "uric-acid", dateISO: "2025-08-01", value: 6.0, unit: "mg/dL" },
  { biomarkerId: "uric-acid", dateISO: "2025-11-01", value: 5.6, unit: "mg/dL" },
  { biomarkerId: "uric-acid", dateISO: "2026-01-15", value: 5.3, unit: "mg/dL" },
];

export function seedIfEmpty(): void {
  if (localStorage.getItem(SEED_KEY)) return; // already seeded
  const existing = load();
  if (existing.length > 0) {
    // Data exists — mark as seeded without overwriting
    localStorage.setItem(SEED_KEY, "1");
    return;
  }
  for (const entry of SEED_DATA) {
    addResult({ ...entry, source: "manual" });
  }
  localStorage.setItem(SEED_KEY, "1");
}
