import { DailyMetrics, TodaysPlan, PlanItem } from "@shared/schema";
import { getBaseline, computeRollingPAS, getPASTrend, computeDailyPAS } from "./scoring";

export function generateTodaysPlan(
  today: DailyMetrics,
  allMetrics: DailyMetrics[],
  showExperimental: boolean
): TodaysPlan {
  const hrvBaseline = getBaseline(allMetrics, "hrv");
  const hrBaseline = getBaseline(allMetrics, "restingHR");
  const hrvBelow = hrvBaseline > 0 && today.hrv < hrvBaseline * 0.85;
  const hrAbove = hrBaseline > 0 && today.restingHR > hrBaseline * 1.08;
  const poorSleep = today.sleepHours < 6.5;
  const highGlucose = (today.glucoseSpikeScore ?? 0) > 70;
  const isRecoveryDay = hrvBelow || poorSleep || hrAbove;
  const highAQI = today.aqi > 100;

  const pasHistory = allMetrics.map((m) => computeDailyPAS(m, allMetrics));
  const trend = getPASTrend(pasHistory);
  const trendingUp = trend === "worsening";

  const exerciseItems: PlanItem[] = [];
  const dietItems: PlanItem[] = [];
  const supplementItems: PlanItem[] = [];
  const sleepItems: PlanItem[] = [];

  // ─── Exercise ─────────────────────────────────────────────────────────────

  if (isRecoveryDay) {
    exerciseItems.push({
      text: "Recovery or Zone 2 cardio only (30-45 min easy pace)",
      why: "Your HRV and sleep signals indicate your body needs recovery. High-intensity training would increase systemic stress.",
      evidenceColor: "green",
    });
    exerciseItems.push({
      text: "Light stretching or yoga session (15-20 min)",
      why: "Gentle movement promotes circulation and parasympathetic activation without taxing recovery capacity.",
      evidenceColor: "green",
    });
    exerciseItems.push({
      text: "Aim for 8,000+ steps throughout the day",
      why: "Low-intensity movement supports metabolic health and mood without impacting recovery.",
      evidenceColor: "green",
    });
  } else if (trendingUp) {
    exerciseItems.push({
      text: "Deload week recommended - reduce volume by 40%",
      why: "Your PAS has been trending upward for 2 weeks. A strategic deload allows accumulated fatigue to dissipate.",
      evidenceColor: "green",
    });
    exerciseItems.push({
      text: "Focus on Zone 2 aerobic base (30-40 min)",
      why: "Zone 2 training builds mitochondrial density without adding significant stress load.",
      evidenceColor: "green",
    });
    exerciseItems.push({
      text: "Add 10 minutes of breathwork or meditation",
      why: "Stress management techniques lower cortisol and support HRV recovery during deload periods.",
      evidenceColor: "green",
    });
  } else {
    exerciseItems.push({
      text: "Zone 2 cardio (30-45 min) or strength training today",
      why: "Your recovery metrics are solid. Both Zone 2 and resistance training are well-supported for longevity.",
      evidenceColor: "green",
    });
    if (!today.strengthSessions) {
      exerciseItems.push({
        text: "Include resistance training - compound movements",
        why: "Muscle mass is a strong predictor of all-cause mortality reduction. Aim for 2-3 sessions per week.",
        evidenceColor: "green",
      });
    }
    if (!today.hiitSessions) {
      exerciseItems.push({
        text: "Consider a HIIT session (20 min, 4-5 intervals)",
        why: "Brief high-intensity intervals improve VO2max and cardiovascular fitness when recovery allows.",
        evidenceColor: "green",
      });
    }
    exerciseItems.push({
      text: "Target 10,000+ steps with regular walking breaks",
      why: "NEAT (non-exercise activity) contributes significantly to daily energy expenditure and metabolic health.",
      evidenceColor: "green",
    });
  }

  if (highAQI) {
    exerciseItems.length = 0;
    exerciseItems.push({
      text: "Move workouts indoors - AQI is above 100",
      why: "Exercising in poor air quality increases oxidative stress and inflammation. Indoor exercise eliminates this exposure.",
      evidenceColor: "green",
    });
    exerciseItems.push({
      text: "Use air purifier during indoor exercise",
      why: "HEPA air purifiers reduce particulate matter exposure during indoor activities.",
      evidenceColor: "yellow",
    });
    exerciseItems.push({
      text: "Consider wearing N95 mask if outdoor activity required",
      why: "N95 masks filter fine particulate matter that contributes to systemic inflammation.",
      evidenceColor: "yellow",
    });
  }

  // ─── Diet ─────────────────────────────────────────────────────────────────

  if (highGlucose || today.lateEating) {
    dietItems.push({
      text: "Low-glycemic Mediterranean diet focus today",
      why: "Reducing glucose variability lowers AGE formation and inflammatory signaling pathways.",
      evidenceColor: "green",
    });
    dietItems.push({
      text: "Take a 10-15 min walk after meals",
      why: "Post-meal walking can reduce glucose spikes by 30-50%. One of the most effective glucose management strategies.",
      evidenceColor: "green",
    });
    dietItems.push({
      text: "Finish eating by 7 PM tonight",
      why: "Late eating disrupts circadian glucose metabolism and impairs overnight recovery processes.",
      evidenceColor: "green",
    });
  } else if (isRecoveryDay) {
    dietItems.push({
      text: "Anti-inflammatory Mediterranean emphasis",
      why: "Omega-3 rich foods, colorful vegetables, and olive oil actively reduce inflammatory markers during recovery.",
      evidenceColor: "green",
    });
    dietItems.push({
      text: "Include omega-3 rich foods (salmon, sardines, walnuts)",
      why: "EPA/DHA from marine sources directly modulate inflammatory resolution pathways.",
      evidenceColor: "green",
    });
    dietItems.push({
      text: "Early dinner - finish eating 3+ hours before bed",
      why: "Early time-restricted eating improves overnight HRV recovery and sleep architecture.",
      evidenceColor: "green",
    });
  } else {
    dietItems.push({
      text: "Balanced Mediterranean-style meals with adequate protein",
      why: "The Mediterranean diet pattern has the strongest evidence base for longevity across multiple large cohort studies.",
      evidenceColor: "green",
    });
    dietItems.push({
      text: "Aim for 30+ grams of fiber from whole foods",
      why: "Dietary fiber supports gut microbiome diversity, which correlates with lower inflammatory markers.",
      evidenceColor: "green",
    });
    dietItems.push({
      text: "Include colorful vegetables at every meal",
      why: "Polyphenols from diverse plant foods activate Nrf2 antioxidant pathways and support cellular health.",
      evidenceColor: "green",
    });
  }

  if (today.alcoholDrinks > 0) {
    dietItems.push({
      text: "Avoid alcohol today for optimal recovery",
      why: "Even moderate alcohol impairs sleep quality, HRV recovery, and increases inflammatory cytokine production.",
      evidenceColor: "green",
    });
  }

  // ─── Supplements ──────────────────────────────────────────────────────────

  if (isRecoveryDay) {
    supplementItems.push({
      text: "Magnesium glycinate (200-400 mg before bed)",
      why: "Magnesium supports GABA receptor function and may improve sleep quality and HRV during recovery. Many adults are deficient.",
      evidenceColor: "yellow",
      cautions: "May cause loose stools at higher doses. Consult your doctor if on medications.",
      timing: "PM",
      group: "suggested",
    });
  }

  supplementItems.push({
    text: "Vitamin D3 (2000-4000 IU daily if deficient)",
    why: "Vitamin D modulates immune function and inflammatory pathways. Blood testing recommended to establish need.",
    evidenceColor: "yellow",
    cautions: "Get levels tested before supplementing. Excess vitamin D can be harmful.",
    timing: "AM",
    group: "stack",
  });

  supplementItems.push({
    text: "Omega-3 fish oil (1-2 g EPA+DHA combined)",
    why: "Meta-analyses show modest cardiovascular and anti-inflammatory benefits, especially if dietary intake is low.",
    evidenceColor: "yellow",
    cautions: "Quality varies significantly. Look for third-party tested brands. May interact with blood thinners.",
    timing: "AM",
    group: "stack",
  });

  if (showExperimental) {
    supplementItems.push({
      text: "NMN/NR (nicotinamide riboside) — 250-500 mg",
      why: "Preclinical data shows NAD+ precursors may support cellular energy metabolism and mitochondrial function. Human longevity data is limited.",
      evidenceColor: "orange",
      cautions: "Long-term safety data in humans is limited. Expensive. Research is ongoing — consult a physician before starting.",
      timing: "AM",
      group: "stack",
      isExperimental: true,
    });
    supplementItems.push({
      text: "Fisetin or Quercetin (senolytic protocol)",
      why: "Animal studies suggest intermittent senolytic dosing may clear senescent cells. Human evidence is preliminary.",
      evidenceColor: "orange",
      cautions: "Experimental. Proper dosing and cycling protocols are not established in humans.",
      timing: "AM",
      group: "stack",
      isExperimental: true,
    });
  }

  // ─── Sleep Plan ───────────────────────────────────────────────────────────

  const sleepDebt = Math.max(0, 8 - today.sleepHours);
  const hrvSuppression = hrvBaseline > 0 ? ((hrvBaseline - today.hrv) / hrvBaseline) * 100 : 0;
  const hrElevation = hrBaseline > 0 ? ((today.restingHR - hrBaseline) / hrBaseline) * 100 : 0;
  const poorSleepConsistency = today.sleepRegularityScore < 70;

  if (sleepDebt > 1) {
    sleepItems.push({
      text: `Extend tonight's sleep by ~${Math.round(Math.min(sleepDebt, 1.5) * 60)} min — you're ${sleepDebt.toFixed(1)} hrs short`,
      why: "Accumulated sleep debt suppresses HRV, elevates cortisol, and accelerates inflammatory processes. Strategic sleep extension can partially reverse a deficit within 48 hours.",
      evidenceColor: "green",
      timing: "anytime",
    });
  }

  if (hrvSuppression > 15) {
    sleepItems.push({
      text: "Digital blackout 60 min before bed — screens off",
      why: `Your HRV is ${Math.round(hrvSuppression)}% below baseline. Blue light suppresses melatonin onset by 1-3 hours, reducing deep sleep and overnight autonomic recovery.`,
      evidenceColor: "green",
      timing: "PM",
    });
  }

  if (hrElevation > 8) {
    sleepItems.push({
      text: "Cool bedroom to 65-68°F (18-20°C) tonight",
      why: `Resting HR is elevated ${Math.round(hrElevation)}% above baseline. Core body temperature must drop to initiate sleep; a cool room accelerates this and improves sleep depth.`,
      evidenceColor: "green",
      timing: "PM",
    });
  }

  if (poorSleepConsistency) {
    sleepItems.push({
      text: "Set a fixed wake time — even on weekends",
      why: "Your sleep regularity score indicates variable timing. A consistent wake time anchors circadian rhythm more reliably than most supplements.",
      evidenceColor: "green",
      timing: "anytime",
    });
  }

  if (today.alcoholDrinks > 0) {
    sleepItems.push({
      text: "No alcohol within 3 hours of bedtime tonight",
      why: "Alcohol increases REM suppression and sleep fragmentation. Even 1-2 drinks before bed reduce deep sleep by ~20% and impair overnight HRV recovery.",
      evidenceColor: "green",
      timing: "PM",
    });
  }

  if (today.lateEating) {
    sleepItems.push({
      text: "Finish all food 3 hours before your target bedtime",
      why: "Late meals elevate core body temperature and glucose during the first sleep cycle, reducing deep sleep onset and circadian alignment.",
      evidenceColor: "green",
      timing: "PM",
    });
  }

  // Default if no specific sleep concerns
  if (sleepItems.length === 0) {
    sleepItems.push({
      text: "Maintain your current sleep window — consistency is the priority",
      why: "Your recovery metrics are solid. Sleep regularity is more predictive of next-day HRV than total hours for most healthy individuals.",
      evidenceColor: "green",
      timing: "anytime",
    });
    sleepItems.push({
      text: "Consider a short 20-min nap before 3 PM if tired",
      why: "Strategic napping (under 30 min) can improve alertness and mood without disrupting nighttime sleep when sleep need is present.",
      evidenceColor: "yellow",
      timing: "anytime",
    });
  }

  // ─── Trim & return ────────────────────────────────────────────────────────

  while (exerciseItems.length > 3) exerciseItems.pop();
  while (dietItems.length > 3) dietItems.pop();

  return {
    exercise: {
      title: "Exercise Plan",
      icon: "activity",
      items: exerciseItems.slice(0, 3),
    },
    diet: {
      title: "Diet Focus",
      icon: "utensils",
      items: dietItems.slice(0, 3),
    },
    supplements: {
      title: "Supplements",
      icon: "pill",
      items: supplementItems,
    },
    sleep: {
      title: "Sleep Plan",
      icon: "moon",
      items: sleepItems.slice(0, 4),
    },
  };
}
