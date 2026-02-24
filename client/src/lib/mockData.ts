import { DailyMetrics, Intervention } from "@shared/schema";

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomTime(baseHour: number, baseMinute: number, varianceMinutes: number): string {
  const totalMinutes = baseHour * 60 + baseMinute + randomInt(-varianceMinutes, varianceMinutes);
  const h = Math.floor(((totalMinutes % 1440) + 1440) % 1440 / 60);
  const m = ((totalMinutes % 60) + 60) % 60;
  return `${String(h).padStart(2, "0")}:${m < 30 ? "00" : "30"}`;
}

export function generateMockData(days = 60): DailyMetrics[] {
  const metrics: DailyMetrics[] = [];
  const today = new Date();

  let baseHRV = randomBetween(45, 65);
  let baseHR = randomBetween(58, 68);
  let baseVO2 = randomBetween(38, 48);

  // Base sleep schedule with some person-to-person variability
  const baseBedtimeHour = randomInt(21, 23);
  const baseWakeHour = randomInt(6, 7);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    baseHRV += randomBetween(-1.5, 1.5);
    baseHRV = Math.max(30, Math.min(80, baseHRV));
    baseHR += randomBetween(-0.5, 0.5);
    baseHR = Math.max(48, Math.min(80, baseHR));

    if (i < 20) {
      baseHRV += 0.2;
      baseHR -= 0.1;
    }

    const alcoholDrinks = isWeekend ? randomInt(0, 3) : randomInt(0, 1);
    const sleepPenalty = alcoholDrinks > 2 ? randomBetween(0.5, 1.5) : 0;
    const sleepHours = Math.max(4, Math.min(10,
      randomBetween(6.5, 8.5) - sleepPenalty + (isWeekend ? 0.5 : 0)
    ));

    const hrvVariation = randomBetween(-12, 12) - (alcoholDrinks * 4) + (sleepHours > 7.5 ? 5 : 0);
    const hrVariation = randomBetween(-5, 5) + (alcoholDrinks * 2) - (sleepHours > 7.5 ? 2 : 0);

    const isStrengthDay = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
    const isHIITDay = dayOfWeek === 2 || dayOfWeek === 6;

    const zone2 = isStrengthDay ? randomInt(0, 15) :
      isHIITDay ? randomInt(5, 15) : randomInt(20, 50);

    const lateEating = isWeekend ? Math.random() > 0.4 : Math.random() > 0.75;

    const hasCGM = Math.random() > 0.3;
    const glucoseBase = lateEating ? randomInt(40, 75) : randomInt(15, 55);

    const aqiBase = randomBetween(20, 80);
    const aqiSpike = Math.random() > 0.85 ? randomInt(60, 150) : 0;

    // Sleep timing: weekends tend toward later bedtime
    const bedtimeVariance = isWeekend ? 45 : 20;
    const wakeVariance = isWeekend ? 60 : 25;
    const bedtimeOffset = isWeekend ? 45 : 0; // 45 min later on weekends
    const wakeOffset = isWeekend ? 60 : 0;    // 60 min later on weekends

    const bedtime = randomTime(baseBedtimeHour, bedtimeOffset, bedtimeVariance);
    const wakeTime = randomTime(baseWakeHour, wakeOffset + 30, wakeVariance);

    // Awakenings correlated with alcohol and poor sleep
    const awakeningsBase = alcoholDrinks > 1 ? randomInt(1, 4) : randomInt(0, 2);
    const awakenings = Math.min(6, awakeningsBase);

    const alcoholTiming = alcoholDrinks > 0
      ? `${String(randomInt(18, 22)).padStart(2, "0")}:00`
      : undefined;

    const lateEatingTime = lateEating
      ? `${String(randomInt(19, 22)).padStart(2, "0")}:${Math.random() > 0.5 ? "30" : "00"}`
      : undefined;

    metrics.push({
      date: dateStr,
      hrv: Math.round(Math.max(15, baseHRV + hrvVariation)),
      restingHR: Math.round(Math.max(42, Math.min(95, baseHR + hrVariation))),
      sleepHours: Math.round(sleepHours * 10) / 10,
      sleepRegularityScore: Math.round(Math.max(20, Math.min(100,
        randomBetween(60, 90) + (isWeekend ? -10 : 5)
      ))),
      steps: randomInt(3000, 16000),
      vo2max: Math.round(Math.max(25, Math.min(60, baseVO2 + randomBetween(-1, 1))) * 10) / 10,
      zone2Minutes: zone2,
      strengthSessions: isStrengthDay && Math.random() > 0.2 ? 1 : 0,
      hiitSessions: isHIITDay && Math.random() > 0.4 ? 1 : 0,
      alcoholDrinks,
      lateEating,
      fastingGlucose: randomInt(78, 105),
      glucoseSpikeScore: hasCGM ? glucoseBase : undefined,
      aqi: Math.round(Math.min(250, aqiBase + aqiSpike)),
      notes: "",
      bedtime,
      wakeTime,
      awakenings,
      alcoholTiming,
      lateEatingTime,
    });
  }

  return metrics;
}

export function generateMockInterventions(): Intervention[] {
  const today = new Date();

  return [
    {
      date: new Date(today.getTime() - 45 * 86400000).toISOString().split("T")[0],
      description: "Started consistent Zone 2 training (4x/week)",
      category: "exercise",
      pasChange: -8,
    },
    {
      date: new Date(today.getTime() - 35 * 86400000).toISOString().split("T")[0],
      description: "Eliminated alcohol on weeknights",
      category: "alcohol",
      pasChange: -5,
    },
    {
      date: new Date(today.getTime() - 28 * 86400000).toISOString().split("T")[0],
      description: "Set consistent 10:30 PM bedtime",
      category: "sleep",
      pasChange: -6,
    },
    {
      date: new Date(today.getTime() - 18 * 86400000).toISOString().split("T")[0],
      description: "Added strength training 3x/week",
      category: "exercise",
      pasChange: -4,
    },
    {
      date: new Date(today.getTime() - 10 * 86400000).toISOString().split("T")[0],
      description: "Adopted time-restricted eating (8hr window)",
      category: "diet",
      pasChange: -3,
    },
    {
      date: new Date(today.getTime() - 5 * 86400000).toISOString().split("T")[0],
      description: "Started daily breathwork practice (10 min)",
      category: "stress",
      pasChange: -2,
    },
  ];
}
