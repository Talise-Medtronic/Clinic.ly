import { useState } from "react"
import DetailCard from "./DetailCard"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

type Range = "7d" | "14d" | "30d"

const heartData = [
  { day: "Jun 3", hr: 72, hrMin: 58, hrMax: 91 },
  { day: "Jun 4", hr: 75, hrMin: 60, hrMax: 94 },
  { day: "Jun 5", hr: 69, hrMin: 55, hrMax: 88 },
  { day: "Jun 6", hr: 78, hrMin: 62, hrMax: 97 },
  { day: "Jun 7", hr: 74, hrMin: 59, hrMax: 90 },
  { day: "Jun 8", hr: 81, hrMin: 64, hrMax: 102 },
  { day: "Jun 9", hr: 74, hrMin: 61, hrMax: 89 },
]

const weightData = [
  { day: "Jun 3", weight: 175.4 },
  { day: "Jun 4", weight: 175.8 },
  { day: "Jun 5", weight: 175.2 },
  { day: "Jun 6", weight: 175.6 },
  { day: "Jun 7", weight: 176.0 },
  { day: "Jun 8", weight: 175.8 },
  { day: "Jun 9", weight: 176.2 },
]

const bpData = [
  { day: "Jun 3", sys: 128, dia: 82 },
  { day: "Jun 4", sys: 132, dia: 84 },
  { day: "Jun 5", sys: 125, dia: 80 },
  { day: "Jun 6", sys: 138, dia: 88 },
  { day: "Jun 7", sys: 136, dia: 87 },
  { day: "Jun 8", sys: 140, dia: 89 },
  { day: "Jun 9", sys: 142, dia: 91 },
]

const spo2Data = [
  { day: "Jun 3", spo2: 98 },
  { day: "Jun 4", spo2: 97 },
  { day: "Jun 5", spo2: 98 },
  { day: "Jun 6", spo2: 96 },
  { day: "Jun 7", spo2: 97 },
  { day: "Jun 8", spo2: 97 },
  { day: "Jun 9", spo2: 97 },
]

const CHART_STYLE = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: "14px 16px 10px",
  marginBottom: 10,
}

const tooltipStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontFamily: "var(--mono)",
  fontSize: 11,
  color: "var(--text)",
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
      {label}
    </div>
  )
}

function ChangePill({ value, unit, positive }: { value: string; unit: string; positive: boolean }) {
  const color = positive ? "var(--amber)" : "var(--green)"
  const arrow = positive ? "↑" : "↓"
  return (
    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color, background: `${color}15`, padding: "2px 8px", borderRadius: 10 }}>
      {arrow} {value} {unit}
    </span>
  )
}

export default function TrendsTab() {
  const [range] = useState<Range>("7d")

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 2 }}>
          Trends
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Past {range === "7d" ? "7" : range === "14d" ? "14" : "30"} days · Synced from device
        </div>
      </div>

      {/* HR chart */}
      <div style={CHART_STYLE}>
        <SectionLabel label="Heart Rate" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 700, color: "var(--text)" }}>74</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-muted)" }}>bpm avg</span>
          </div>
          <ChangePill value="2 bpm" unit="vs last week" positive={true} />
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={heartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
            <XAxis dataKey="day" tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "rgba(30,41,59,0.4)" }} axisLine={false} tickLine={false} />
            <YAxis domain={[50, 110]} tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "rgba(30,41,59,0.4)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "rgba(30,41,59,0.7)", marginBottom: 4 }} />
            <ReferenceLine y={100} stroke="rgba(239,68,68,0.3)" strokeDasharray="4 4" />
            <ReferenceLine y={60} stroke="rgba(239,68,68,0.3)" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="hr" stroke="#ef4444" strokeWidth={2} dot={false} name="HR (bpm)" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-muted)" }}>MIN 69 · MAX 81 · TARGET 60–100</span>
        </div>
      </div>

      {/* BP chart */}
      <div style={CHART_STYLE}>
        <SectionLabel label="Blood Pressure" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 700, color: "var(--text)" }}>134/86</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-muted)" }}>avg</span>
          </div>
          <ChangePill value="6 mmHg sys" unit="vs last week" positive={true} />
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={bpData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
            <XAxis dataKey="day" tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "rgba(30,41,59,0.4)" }} axisLine={false} tickLine={false} />
            <YAxis domain={[70, 160]} tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "rgba(30,41,59,0.4)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "rgba(30,41,59,0.7)", marginBottom: 4 }} />
            <ReferenceLine y={130} stroke="rgba(239,68,68,0.25)" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="sys" stroke="#1a6cf0" strokeWidth={2} dot={false} name="Systolic" />
            <Line type="monotone" dataKey="dia" stroke="#4fc3f7" strokeWidth={1.5} dot={false} strokeDasharray="5 3" name="Diastolic" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 12, height: 2, background: "#1a6cf0", borderRadius: 1 }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-muted)" }}>Systolic</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 12, height: 2, background: "#4fc3f7", borderRadius: 1 }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-muted)" }}>Diastolic</span>
          </div>
          <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-muted)", marginLeft: "auto" }}>TARGET &lt;130/80</span>
        </div>
      </div>

      {/* Weight chart */}
      <div style={CHART_STYLE}>
        <SectionLabel label="Weight" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 700, color: "var(--text)" }}>176.2</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-muted)" }}>lbs today</span>
          </div>
          <ChangePill value="0.8 lbs" unit="this week" positive={true} />
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={weightData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
            <XAxis dataKey="day" tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "rgba(30,41,59,0.4)" }} axisLine={false} tickLine={false} />
            <YAxis domain={[173, 179]} tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "rgba(30,41,59,0.4)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "rgba(30,41,59,0.7)", marginBottom: 4 }} />
            <Line type="monotone" dataKey="weight" stroke="#4fc3f7" strokeWidth={2} dot={{ r: 3, fill: "#4fc3f7", stroke: "transparent" }} name="Weight (lbs)" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-muted)", marginTop: 6 }}>
          MIN 175.2 · MAX 176.2 · NOTE: Rapid gain (&gt;2 lbs/day) should be reported
        </div>
      </div>

      {/* SpO2 chart */}
      <div style={{ ...CHART_STYLE, marginBottom: 0 }}>
        <SectionLabel label="Oxygen Saturation (SpO₂)" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 700, color: "var(--text)" }}>97.3</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-muted)" }}>% avg</span>
          </div>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--green)", background: "rgba(34,197,94,0.12)", padding: "2px 8px", borderRadius: 10 }}>
            All within range
          </span>
        </div>
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={spo2Data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
            <XAxis dataKey="day" tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "rgba(30,41,59,0.4)" }} axisLine={false} tickLine={false} />
            <YAxis domain={[93, 100]} tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "rgba(30,41,59,0.4)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "rgba(30,41,59,0.7)", marginBottom: 4 }} />
            <ReferenceLine y={95} stroke="rgba(239,68,68,0.25)" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="spo2" stroke="#00d4ff" strokeWidth={2} dot={false} name="SpO₂ (%)" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-muted)", marginTop: 6 }}>
          TARGET ≥95% · RED LINE = lower limit
        </div>
      </div>
    </div>
  )
}
