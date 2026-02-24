import { z } from "zod";

export const dailyMetricsSchema = z.object({
  date: z.string(),
  hrv: z.number().min(0),
  restingHR: z.number().min(30).max(120),
  sleepHours: z.number().min(0).max(24),
  sleepRegularityScore: z.number().min(0).max(100),
  steps: z.number().min(0).optional(),
  vo2max: z.number().min(10).max(80),
  zone2Minutes: z.number().min(0),
  strengthSessions: z.number().min(0).max(1),
  hiitSessions: z.number().min(0).max(1),
  alcoholDrinks: z.number().min(0).max(5),
  lateEating: z.boolean(),
  fastingGlucose: z.number().min(50).max(300).optional(),
  glucoseSpikeScore: z.number().min(0).max(100).optional(),
  aqi: z.number().min(0).max(300),
  notes: z.string(),
});

export type DailyMetrics = z.infer<typeof dailyMetricsSchema>;

export interface PlanItem {
  text: string;
  why: string;
  evidenceColor: "green" | "yellow" | "orange" | "red";
  cautions?: string;
}

export interface PlanCategory {
  title: string;
  icon: string;
  items: PlanItem[];
}

export interface TodaysPlan {
  exercise: PlanCategory;
  diet: PlanCategory;
  supplements: PlanCategory;
}

export interface Intervention {
  date: string;
  description: string;
  category: "sleep" | "exercise" | "diet" | "alcohol" | "stress";
  pasChange: number;
}

export interface RiskCategory {
  name: string;
  level: "low" | "moderate" | "high";
  score: number;
  description: string;
}

export const PAS_WEIGHTS = {
  recovery: 0.30,
  metabolic: 0.20,
  fitness: 0.25,
  inflammatory: 0.15,
  environmental: 0.10,
};

export interface HealthDataProvider {
  getDailyMetrics(startDate: string, endDate: string): Promise<DailyMetrics[]>;
}
