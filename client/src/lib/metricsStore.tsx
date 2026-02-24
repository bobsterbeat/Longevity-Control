import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { DailyMetrics, Intervention } from "@shared/schema";
import { generateMockData, generateMockInterventions } from "./mockData";

interface MetricsContextType {
  metrics: DailyMetrics[];
  interventions: Intervention[];
  showExperimental: boolean;
  setShowExperimental: (v: boolean) => void;
  updateToday: (updates: Partial<DailyMetrics>) => void;
  resetData: () => void;
}

const MetricsContext = createContext<MetricsContextType | null>(null);

export function MetricsProvider({ children }: { children: ReactNode }) {
  const [metrics, setMetrics] = useState<DailyMetrics[]>(() => generateMockData(60));
  const [interventions] = useState<Intervention[]>(() => generateMockInterventions());
  const [showExperimental, setShowExperimental] = useState(false);

  const updateToday = useCallback((updates: Partial<DailyMetrics>) => {
    setMetrics((prev) => {
      const copy = [...prev];
      const lastIdx = copy.length - 1;
      copy[lastIdx] = { ...copy[lastIdx], ...updates };
      return copy;
    });
  }, []);

  const resetData = useCallback(() => {
    setMetrics(generateMockData(60));
  }, []);

  return (
    <MetricsContext.Provider
      value={{ metrics, interventions, showExperimental, setShowExperimental, updateToday, resetData }}
    >
      {children}
    </MetricsContext.Provider>
  );
}

export function useMetrics() {
  const ctx = useContext(MetricsContext);
  if (!ctx) throw new Error("useMetrics must be used within MetricsProvider");
  return ctx;
}
