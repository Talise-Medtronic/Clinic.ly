// Per-patient vitals monitoring with 14-day trend/history.
// Deterministic mock data seeded by patient id so values are stable across renders.

export type VitalKind =
  | "bloodPressure"
  | "heartRate"
  | "medicationAdherence"
  | "activity"
  | "symptoms"
  | "weight"

export type VitalStatus = "normal" | "watch" | "alert"
export type TrendDirection = "flat" | "up" | "down"

export interface VitalReading {
  timestamp: string // ISO date
  value: number
  secondary?: number // diastolic for blood pressure
}

export interface VitalSeries {
  kind: VitalKind
  displayName: string
  unit: string
  readings: VitalReading[]
  latest: VitalReading
  change: number
  trend: TrendDirection
  status: VitalStatus
  latestDisplay: string
}

const DAYS = 14

const DISPLAY_NAME: Record<VitalKind, string> = {
  bloodPressure: "Blood Pressure",
  heartRate: "Heart Rate",
  medicationAdherence: "Medication Adherence",
  activity: "Activity",
  symptoms: "Symptoms",
  weight: "Weight",
}

const UNIT: Record<VitalKind, string> = {
  bloodPressure: "mmHg",
  heartRate: "bpm",
  medicationAdherence: "%",
  activity: "steps",
  symptoms: "score",
  weight: "lb",
}

// Higher values are worse for these; a rising trend is clinically bad.
export function higherIsWorse(kind: VitalKind): boolean {
  return (
    kind === "bloodPressure" ||
    kind === "heartRate" ||
    kind === "symptoms" ||
    kind === "weight"
  )
}

function stableSeed(patientId: string): number {
  let hash = 17
  for (const ch of patientId ?? "") hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return hash
}

// Small deterministic PRNG (mulberry32) so charts stay stable per patient.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

function statusFor(kind: VitalKind, readings: VitalReading[]): VitalStatus {
  const latest = readings[readings.length - 1]
  if (!latest) return "normal"

  switch (kind) {
    case "bloodPressure":
      if (latest.value >= 140 || (latest.secondary ?? 0) >= 90) return "alert"
      if (latest.value >= 130 || (latest.secondary ?? 0) >= 80) return "watch"
      return "normal"
    case "heartRate":
      if (latest.value > 100 || latest.value < 50) return "alert"
      if (latest.value > 90 || latest.value < 60) return "watch"
      return "normal"
    case "medicationAdherence":
      if (latest.value < 80) return "alert"
      if (latest.value < 90) return "watch"
      return "normal"
    case "activity":
      if (latest.value < 2000) return "alert"
      if (latest.value < 4000) return "watch"
      return "normal"
    case "symptoms":
      if (latest.value >= 6) return "alert"
      if (latest.value >= 3) return "watch"
      return "normal"
    case "weight": {
      if (readings.length < 2) return "normal"
      const gain = latest.value - readings[0].value
      if (gain >= 4.4) return "alert"
      if (gain >= 2.2) return "watch"
      return "normal"
    }
    default:
      return "normal"
  }
}

function buildSeries(kind: VitalKind, rng: () => number): VitalSeries {
  const readings: VitalReading[] = []
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (DAYS - 1))

  const systolic = kind === "bloodPressure"
  const randInt = (min: number, max: number) => Math.floor(rng() * (max - min)) + min

  let baseVal = 0
  let drift = 0
  let noise = 1
  switch (kind) {
    case "bloodPressure":
      baseVal = 122 + randInt(-6, 10); drift = randInt(0, 3); noise = 4; break
    case "heartRate":
      baseVal = 68 + randInt(-8, 12); drift = randInt(-1, 2); noise = 5; break
    case "medicationAdherence":
      baseVal = 94 + randInt(-6, 5); drift = randInt(-1, 1); noise = 4; break
    case "activity":
      baseVal = 5200 + randInt(-1500, 2000); drift = randInt(-120, 120); noise = 900; break
    case "symptoms":
      baseVal = 2 + randInt(0, 2); drift = rng() > 0.7 ? 0.3 : 0; noise = 1; break
    case "weight":
      baseVal = 172 + randInt(-22, 26); drift = rng() > 0.6 ? 0.33 : 0; noise = 0.9; break
  }

  for (let i = 0; i < DAYS; i++) {
    let value = baseVal + drift * i + (rng() - 0.5) * 2 * noise

    let secondary: number | undefined
    if (systolic) {
      const dia = 78 + (value - baseVal) * 0.5 + (rng() - 0.5) * 4
      secondary = Math.round(clamp(dia, 55, 110))
    }

    switch (kind) {
      case "medicationAdherence": value = clamp(value, 0, 100); break
      case "symptoms": value = clamp(value, 0, 10); break
      case "activity": value = Math.max(0, value); break
    }

    const day = new Date(start)
    day.setDate(start.getDate() + i)

    readings.push({
      timestamp: day.toISOString().slice(0, 10),
      value: kind === "weight" ? Math.round(value * 10) / 10 : Math.round(value),
      secondary,
    })
  }

  const latest = readings[readings.length - 1]
  const change = readings.length >= 2 ? latest.value - readings[0].value : 0
  const trend: TrendDirection = change > 0.5 ? "up" : change < -0.5 ? "down" : "flat"
  const status = statusFor(kind, readings)

  const latestDisplay =
    kind === "bloodPressure"
      ? `${Math.round(latest.value)}/${Math.round(latest.secondary ?? 0)}`
      : kind === "weight"
        ? latest.value.toFixed(1)
        : String(Math.round(latest.value))

  return {
    kind,
    displayName: DISPLAY_NAME[kind],
    unit: UNIT[kind],
    readings,
    latest,
    change,
    trend,
    status,
    latestDisplay,
  }
}

export function getVitals(patientId: string): VitalSeries[] {
  const rng = mulberry32(stableSeed(patientId))
  const kinds: VitalKind[] = [
    "bloodPressure",
    "heartRate",
    "medicationAdherence",
    "activity",
    "symptoms",
    "weight",
  ]
  return kinds.map((k) => buildSeries(k, rng))
}
