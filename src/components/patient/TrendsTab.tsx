import { useEffect, useMemo, useState } from "react"
import { patients } from "../../data/patients"
import patientEventsDb from "../../data/patient-events.json"
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

interface PatientEvent {
  eventId: string
  eventType: string
  localDate: string
  localHour: number
  dayOfWeek: string
  minutesSincePreviousEvent: number | null
}

interface PatientEventsRecord {
  patientId: string
  events: PatientEvent[]
}

interface PatientEventsDb {
  patients: PatientEventsRecord[]
}

const eventsDatabase = patientEventsDb as PatientEventsDb
const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const chartStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: "14px 16px 12px",
  marginBottom: 10,
}

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

const tooltipStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontFamily: "var(--mono)",
  fontSize: 11,
  color: "var(--text)",
}

export default function TrendsTab() {
  const [isMobile, setIsMobile] = useState(false)
  const [mobileView, setMobileView] = useState<"events" | "vitals">("events")

  const loggedInPatientId = useMemo(
    () => patients.find((p) => p.name === "John Smith")?.id ?? "p9",
    [],
  )
  const loggedInPatient = useMemo(
    () => patients.find((p) => p.id === loggedInPatientId),
    [loggedInPatientId],
  )
  const patientEvents = useMemo(() => {
    return eventsDatabase.patients.find((entry) => entry.patientId === loggedInPatientId)?.events ?? []
  }, [loggedInPatientId])

  const frequencyByDate = useMemo(() => {
    const counts = new Map<string, number>()
    patientEvents.forEach((ev) => {
      counts.set(ev.localDate, (counts.get(ev.localDate) ?? 0) + 1)
    })

    return [...counts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }))
  }, [patientEvents])

  const eventsByDayHour = useMemo(() => {
    const matrix = dayOrder.map((day) => ({
      day,
      hours: Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 })),
    }))
    const dayIndex = new Map(dayOrder.map((day, index) => [day, index]))

    patientEvents.forEach((ev) => {
      const rowIndex = dayIndex.get(ev.dayOfWeek)
      if (rowIndex === undefined) return
      const hour = Math.max(0, Math.min(23, ev.localHour))
      matrix[rowIndex].hours[hour].count += 1
    })

    return matrix
  }, [patientEvents])

  const intervalSeries = useMemo(() => {
    return [...patientEvents]
      .filter((ev): ev is PatientEvent & { minutesSincePreviousEvent: number } => typeof ev.minutesSincePreviousEvent === "number")
      .map((ev, index) => ({
        index: index + 1,
        eventId: ev.eventId,
        minutes: ev.minutesSincePreviousEvent,
      }))
  }, [patientEvents])

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 900)
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const eventTrendsContent = (
    <>
      <div style={chartStyle}>
        <SectionLabel label="Event Frequency Activity" />
        <EventActivityGrid data={frequencyByDate} />
      </div>

      <div style={chartStyle}>
        <SectionLabel label="Time-of-Day Distribution" />
        <DayHourHeatmap data={eventsByDayHour} />
      </div>

      <div style={{ ...chartStyle, marginBottom: 0 }}>
        <SectionLabel label="Inter-Event Interval Trend" />
        <IntervalTrendChart data={intervalSeries} />
      </div>
    </>
  )

  const vitalTrendsContent = (
    <>
      <div style={chartStyle}>
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
          <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-muted)" }}>MIN 69 · MAX 81 · TARGET 60-100</span>
        </div>
      </div>

      <div style={chartStyle}>
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

      <div style={chartStyle}>
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

      <div style={{ ...chartStyle, marginBottom: 0 }}>
        <SectionLabel label="Oxygen Saturation (SpO2)" />
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
            <Line type="monotone" dataKey="spo2" stroke="#00d4ff" strokeWidth={2} dot={false} name="SpO2 (%)" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-muted)", marginTop: 6 }}>
          TARGET &gt;=95% · RED LINE = lower limit
        </div>
      </div>
    </>
  )

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 2 }}>
          Trends
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {loggedInPatient?.name ?? "Patient"} · Event trends from your remote logs
        </div>
      </div>

      {isMobile ? (
        <>
          <div
            style={{
              display: "flex",
              gap: 8,
              background: "rgba(255,255,255,0.84)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 4,
              marginBottom: 12,
            }}
          >
            {([
              { key: "events", label: "Heart Event Trends" },
              { key: "vitals", label: "Vital Trends" },
            ] as const).map((tab) => {
              const active = mobileView === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setMobileView(tab.key)}
                  style={{
                    flex: 1,
                    border: "1px solid rgba(20, 15, 75, 0.14)",
                    borderRadius: 8,
                    background: active ? "rgba(16,16,235,0.12)" : "#fff",
                    color: active ? "var(--blue)" : "var(--text-muted)",
                    fontFamily: "var(--sans)",
                    fontSize: 11,
                    fontWeight: active ? 700 : 600,
                    padding: "7px 8px",
                    cursor: "pointer",
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
          {mobileView === "events" ? eventTrendsContent : vitalTrendsContent}
        </>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 12,
            alignItems: "start",
          }}
        >
          <div>
            <div style={{ margin: "2px 2px 10px", fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Heart Event Trends
            </div>
            {eventTrendsContent}
          </div>
          <div>
            <div style={{ margin: "2px 2px 10px", fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Vital Trends
            </div>
            {vitalTrendsContent}
          </div>
        </div>
      )}
    </div>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div
      style={{
        fontFamily: "var(--mono)",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: "var(--text-muted)",
        marginBottom: 10,
      }}
    >
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

function dateKeyLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function EventActivityGrid({ data }: { data: Array<{ date: string; count: number }> }) {
  if (data.length === 0) {
    return <EmptyTrendState message="No event history available yet." />
  }

  const countByDate = new Map(data.map((item) => [item.date, item.count]))
  const end = new Date()
  end.setHours(0, 0, 0, 0)

  const totalDays = 84
  const days: Array<{ key: string; count: number; date: Date }> = []
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(end.getDate() - i)
    const key = dateKeyLocal(d)
    days.push({ key, count: countByDate.get(key) ?? 0, date: d })
  }

  const maxCount = Math.max(...days.map((d) => d.count), 1)
  const startWeekday = (days[0].date.getDay() + 6) % 7
  const weekCount = Math.ceil((days.length + startWeekday) / 7)
  const weeks = Array.from({ length: weekCount }, () => Array.from({ length: 7 }, () => null as null | typeof days[number]))

  days.forEach((day, index) => {
    const weekIndex = Math.floor((index + startWeekday) / 7)
    const row = (day.date.getDay() + 6) % 7
    weeks[weekIndex][row] = day
  })

  const rowLabels = ["M", "", "W", "", "F", "", ""]

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <div style={{ width: 12, display: "grid", gap: 3, marginTop: 1 }}>
          {rowLabels.map((label, idx) => (
            <div key={`label-${idx}`} style={{ height: 11, fontFamily: "var(--mono)", fontSize: 8, color: "var(--text-muted)", lineHeight: "11px" }}>
              {label}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 3, overflowX: "auto", paddingBottom: 4, flex: 1 }}>
          {weeks.map((week, weekIdx) => (
            <div key={`week-${weekIdx}`} style={{ display: "grid", gap: 3 }}>
              {week.map((cell, dayIdx) => {
                const count = cell?.count ?? 0
                const alpha = count === 0 ? 0.08 : 0.22 + (count / maxCount) * 0.62
                const fill = `rgba(16,16,235,${alpha})`

                return (
                  <div
                    key={`cell-${weekIdx}-${dayIdx}`}
                    title={cell ? `${cell.key}: ${cell.count} event${cell.count === 1 ? "" : "s"}` : "No data"}
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: 2,
                      border: "1px solid rgba(20, 15, 75, 0.08)",
                      background: fill,
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-muted)" }}>
        <span>Less</span>
        {[0.08, 0.28, 0.5, 0.72].map((alpha) => (
          <div
            key={`legend-${alpha}`}
            style={{
              width: 11,
              height: 11,
              borderRadius: 2,
              border: "1px solid rgba(20, 15, 75, 0.08)",
              background: `rgba(16,16,235,${alpha})`,
            }}
          />
        ))}
        <span>More</span>
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-muted)" }}>
        {data.reduce((sum, d) => sum + d.count, 0)} total logged events in recent activity window
      </div>
    </div>
  )
}

function DayHourHeatmap({
  data,
}: {
  data: Array<{ day: string; hours: Array<{ hour: number; count: number }> }>
}) {
  const maxCount = Math.max(...data.flatMap((row) => row.hours.map((h) => h.count)), 0)
  if (maxCount === 0) {
    return <EmptyTrendState message="No time-of-day pattern available yet." />
  }

  return (
    <div style={{ overflowX: "auto", paddingBottom: 4 }}>
      <div style={{ minWidth: 700, display: "grid", gap: 5 }}>
        <div style={{ display: "grid", gridTemplateColumns: "72px repeat(24, 1fr)", gap: 3 }}>
          <div />
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={`h-${hour}`} style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-muted)", textAlign: "center" }}>
              {hour}
            </div>
          ))}
        </div>
        {data.map((row) => (
          <div key={row.day} style={{ display: "grid", gridTemplateColumns: "72px repeat(24, 1fr)", gap: 3, alignItems: "center" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-muted)" }}>{row.day.slice(0, 3)}</div>
            {row.hours.map((cell) => {
              const alpha = cell.count === 0 ? 0.08 : 0.22 + (cell.count / maxCount) * 0.6
              return (
                <div
                  key={`${row.day}-${cell.hour}`}
                  title={`${row.day} ${cell.hour.toString().padStart(2, "0")}:00 - ${cell.count} events`}
                  style={{
                    height: 14,
                    borderRadius: 3,
                    border: "1px solid rgba(20, 15, 75, 0.08)",
                    background: `rgba(16,16,235,${alpha})`,
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function IntervalTrendChart({
  data,
}: {
  data: Array<{ index: number; eventId: string; minutes: number }>
}) {
  if (data.length === 0) {
    return <EmptyTrendState message="No interval trend available yet." />
  }

  const w = 460
  const h = 140
  const padL = 24
  const padR = 10
  const padT = 12
  const padB = 20
  const minY = Math.min(...data.map((d) => d.minutes))
  const maxY = Math.max(...data.map((d) => d.minutes))
  const yRange = Math.max(maxY - minY, 1)
  const xStep = data.length > 1 ? (w - padL - padR) / (data.length - 1) : 0

  const points = data
    .map((d, i) => {
      const x = padL + i * xStep
      const y = padT + (1 - (d.minutes - minY) / yRange) * (h - padT - padB)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: 160, background: "rgba(255,255,255,0.72)", borderRadius: 8, border: "1px solid rgba(20, 15, 75, 0.1)" }}>
        <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="rgba(20,15,75,0.25)" strokeWidth={1} />
        <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="rgba(20,15,75,0.25)" strokeWidth={1} />
        <polyline points={points} fill="none" stroke="var(--amber)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = padL + i * xStep
          const y = padT + (1 - (d.minutes - minY) / yRange) * (h - padT - padB)
          return <circle key={d.eventId} cx={x} cy={y} r={3} fill="var(--amber)" />
        })}
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 6 }}>
        {data.map((item) => (
          <div key={`${item.eventId}-meta`} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-muted)", border: "1px solid rgba(20, 15, 75, 0.1)", borderRadius: 6, padding: "6px 8px", background: "rgba(255,255,255,0.66)" }}>
            #{item.index} · {item.minutes} min
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyTrendState({ message }: { message: string }) {
  return <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--text-muted)" }}>{message}</div>
}
