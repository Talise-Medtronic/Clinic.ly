import { useMemo, useState } from "react"
import type { Patient } from "../data/patients"
import {
  getVitals,
  higherIsWorse,
  type TrendDirection,
  type VitalSeries,
  type VitalStatus,
} from "../data/vitals"

interface Props {
  patient: Patient
  onClinicalNotesChange: (value: string) => void
}

function alertColor(level: number): string {
  if (level >= 9) return "var(--danger)"
  if (level >= 7) return "var(--warning)"
  if (level >= 5) return "var(--accent)"
  if (level >= 3) return "var(--accent-2)"
  return "var(--ok)"
}

function alertLabel(level: number): string {
  if (level >= 9) return "CRITICAL"
  if (level >= 7) return "HIGH"
  if (level >= 5) return "MODERATE"
  if (level >= 3) return "LOW"
  return "STABLE"
}

export default function PatientDetail({ patient, onClinicalNotesChange }: Props) {
  const color = alertColor(patient.alertLevel)
  const isCritical = patient.alertLevel >= 9
  const isAbnormalRhythm = hasAbnormalRhythm(patient)
  const eventTimeLabel = useMemo(() => getEventTimeLabel(patient), [patient])
  const [confirmedByPatientId, setConfirmedByPatientId] = useState<Record<string, boolean>>({})
  const isConfirmed = !!confirmedByPatientId[patient.id]

  function toggleEventConfirmation() {
    setConfirmedByPatientId((prev) => ({ ...prev, [patient.id]: !prev[patient.id] }))
  }

  return (
    <div
      style={{
        padding: "24px 20px",
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        background: "rgba(255,255,255,0.4)",
        animation: "panel-rise 360ms ease-out",
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--text-strong)",
                margin: 0,
                marginBottom: 4,
              }}
            >
              {patient.name}
            </h2>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--text-subtle)",
              }}
            >
              Age {patient.age} · Implanted {patient.implantDate}
            </div>
          </div>

          {/* Level badge */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: color,
                color: "#f7fffc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontSize: 20,
                fontWeight: 700,
                boxShadow: isCritical ? `0 0 20px ${color}` : "none",
              }}
            >
              {patient.alertLevel}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                fontWeight: 700,
                color: color,
                letterSpacing: "0.08em",
              }}
            >
              {alertLabel(patient.alertLevel)}
            </div>
          </div>
        </div>

        {/* Alert banner */}
        <div
          style={{
            background: `rgba(${isCritical ? "209,73,47" : patient.alertLevel >= 7 ? "255,184,28" : patient.alertLevel >= 5 ? "0,94,184" : "0,169,224"},0.13)`,
            borderRadius: 10,
            padding: "12px 14px",
            borderLeft: `3px solid ${color}`,
            border: "1px solid rgba(0, 79, 154, 0.18)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 13,
              fontWeight: 600,
              color: color,
              marginBottom: 4,
            }}
          >
            {patient.alertTitle}
          </div>
          <div
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: 12,
              color: "var(--text-mid)",
              lineHeight: 1.55,
            }}
          >
            {patient.alertDescription}
          </div>
        </div>
      </div>

      <SectionCard title="Header Details" actions={<CardActions labels={["Edit"]} />}>
        <Row label="Type" value={alertLabel(patient.alertLevel)} />
        <Row label="Expiration (UTC)" value="2026-12-31 23:59 UTC" mono />
        <Row label="Model" value={patient.deviceModel} />
        <Row label="Device ID" value={patient.deviceId} mono />
        <Row label="Implant Date" value={patient.implantDate} mono />
      </SectionCard>

      {isAbnormalRhythm && (
        <SectionCard title="ECG Event Snapshot" actions={<CardActions labels={[isConfirmed ? "Confirmed" : "Needs Review"]} />}>
          <div
            style={{
              background: "rgba(255,255,255,0.74)",
              borderRadius: 10,
              border: "1px solid rgba(0, 79, 154, 0.16)",
              overflow: "hidden",
              boxShadow: "0 6px 14px rgba(0, 57, 107, 0.06)",
            }}
          >
            <EcgSnapshot level={patient.alertLevel} />
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
            <Row label="Detected Event" value={patient.alertTitle} />
            <Row label="Snapshot Time" value={eventTimeLabel} />
            <Row label="Status" value={isConfirmed ? "Doctor Confirmed" : "Awaiting Doctor Confirmation"} />
          </div>

          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={toggleEventConfirmation}
              style={{
                border: "1px solid rgba(20, 15, 75, 0.2)",
                borderRadius: 8,
                background: isConfirmed ? "rgba(0, 139, 93, 0.14)" : "#fff",
                color: isConfirmed ? "var(--ok)" : "var(--text-mid)",
                fontFamily: "var(--font-ui)",
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              {isConfirmed ? "Unconfirm Event" : "Confirm Event"}
            </button>
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 12,
                color: isConfirmed ? "var(--ok)" : "var(--warning)",
              }}
            >
              {isConfirmed ? "Event review complete" : "Doctor action requested"}
            </span>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Content" actions={<CardActions labels={["Add"]} />}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 8,
          }}
        >
          {patient.readings.map((r) => (
            <div
              key={r.label}
              style={{
                background: "rgba(255,255,255,0.74)",
                borderRadius: 10,
                padding: "10px 12px",
                border: "1px solid rgba(0, 79, 154, 0.14)",
                boxShadow: "0 6px 14px rgba(0, 57, 107, 0.06)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--text-subtle)",
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {r.label}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--text-strong)",
                  lineHeight: 1,
                }}
              >
                {r.value}
                {r.unit && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 400,
                      color: "var(--text-subtle)",
                      marginLeft: 4,
                    }}
                  >
                    {r.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Vitals & Monitoring" actions={<CardActions labels={["Last 14 days"]} />}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 8,
          }}
        >
          {getVitals(patient.id).map((v) => (
            <VitalCard key={v.kind} series={v} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Application IDs" actions={<CardActions labels={["Edit", "Add"]} />}>
        <Row label="Primary App" value="Clinic Remote Monitor" />
        <Row label="App ID" value={`${patient.deviceId}-APP`} mono />
        <Row label="Integration" value="Rhythm Legacy Connector" />
      </SectionCard>

      <SectionCard title="Users" actions={<CardActions labels={["Edit", "Add"]} />}>
        <Row label="Attending" value="Dr Doof" />
        <Row label="Role" value="Cardiology" />
      </SectionCard>

      <SectionCard title="Clinical Notes" actions={<CardActions labels={["Save"]} />}>
        <textarea
          value={patient.clinicalNotes}
          onChange={(e) => onClinicalNotesChange(e.target.value)}
          aria-label="Clinical notes"
          style={{
            background: "var(--surface-card)",
            borderRadius: 10,
            padding: "12px 14px",
            fontFamily: "var(--font-ui)",
            fontSize: 13,
            color: "var(--text-mid)",
            lineHeight: 1.65,
            border: "1px solid rgba(20, 15, 75, 0.14)",
            width: "100%",
            minHeight: 130,
            resize: "vertical",
            outline: "none",
          }}
        />
      </SectionCard>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        fontWeight: 700,
        color: "var(--text-subtle)",
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  )
}

function SectionCard({
  title,
  actions,
  children,
}: {
  title: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section
      style={{
        background: "var(--surface-card)",
        borderRadius: 10,
        border: "1px solid rgba(20, 15, 75, 0.14)",
        boxShadow: "0 8px 18px rgba(20, 15, 75, 0.08)",
        overflow: "hidden",
      }}
    >
      <div style={{ height: 3, background: "var(--primary-base)" }} />
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
          <SectionLabel>{title}</SectionLabel>
          {actions}
        </div>
        {children}
      </div>
    </section>
  )
}

function CardActions({ labels }: { labels: string[] }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {labels.map((label) => (
        <button
          key={label}
          style={{
            border: "1px solid rgba(20, 15, 75, 0.18)",
            borderRadius: 8,
            background: "#fff",
            color: "var(--text-mid)",
            fontFamily: "var(--font-ui)",
            fontSize: 11,
            padding: "4px 8px",
            cursor: "pointer",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--text-subtle)",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: mono ? "var(--font-mono)" : "var(--font-ui)",
          fontSize: mono ? 12 : 13,
          color: "var(--text-mid)",
          textAlign: "right",
          wordBreak: "break-all",
        }}
      >
        {value}
      </span>
    </div>
  )
}

function vitalStatusColor(status: VitalStatus): string {
  if (status === "alert") return "var(--danger)"
  if (status === "watch") return "var(--warning)"
  return "var(--ok)"
}

function vitalStatusLabel(status: VitalStatus): string {
  if (status === "alert") return "ALERT"
  if (status === "watch") return "WATCH"
  return "NORMAL"
}

function trendArrow(t: TrendDirection): string {
  if (t === "up") return "\u2191"
  if (t === "down") return "\u2193"
  return "\u2192"
}

function changeText(v: VitalSeries): string {
  if (Math.abs(v.change) < 0.05) return "stable"
  const sign = v.change > 0 ? "+" : "-"
  const mag = Math.abs(v.change)
  const val = v.kind === "weight" ? mag.toFixed(1) : String(Math.round(mag))
  return `${sign}${val} ${v.unit}`
}

function trendColor(v: VitalSeries): string {
  if (v.trend === "flat") return "var(--text-subtle)"
  const rising = v.trend === "up"
  const bad = higherIsWorse(v.kind) ? rising : !rising
  return bad ? "var(--danger)" : "var(--ok)"
}

function Sparkline({ series }: { series: VitalSeries }) {
  const pts = series.readings
  if (pts.length < 2) return null

  const w = 200
  const h = 34
  const pad = 3
  const values = pts.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min < 1e-6 ? 1 : max - min
  const stepX = (w - pad * 2) / (pts.length - 1)

  const points = pts
    .map((p, i) => {
      const x = pad + stepX * i
      const y = h - pad - ((p.value - min) / range) * (h - pad * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: 34, marginTop: 8, display: "block" }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={vitalStatusColor(series.status)}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function VitalCard({ series }: { series: VitalSeries }) {
  const color = vitalStatusColor(series.status)

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.74)",
        borderRadius: 10,
        padding: "10px 12px",
        border: "1px solid rgba(0, 79, 154, 0.14)",
        boxShadow: "0 6px 14px rgba(0, 57, 107, 0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--text-subtle)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {series.displayName}
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            fontWeight: 700,
            color: "#f7fffc",
            background: color,
            borderRadius: 999,
            padding: "2px 6px",
            letterSpacing: "0.06em",
            flexShrink: 0,
          }}
        >
          {vitalStatusLabel(series.status)}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 20,
            fontWeight: 700,
            color: "var(--text-strong)",
            lineHeight: 1,
          }}
        >
          {series.latestDisplay}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-subtle)" }}>
          {series.unit}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 600,
            color: trendColor(series),
          }}
        >
          {trendArrow(series.trend)} {changeText(series)}
        </span>
      </div>

      <Sparkline series={series} />
    </div>
  )
}

function hasAbnormalRhythm(patient: Patient): boolean {
  const text = `${patient.alertTitle} ${patient.alertDescription}`.toLowerCase()
  return patient.alertLevel >= 7 || /(af|vf|vt|arrhythm|tachy|brady|rhythm)/.test(text)
}

function getEventTimeLabel(patient: Patient): string {
  const entry = patient.readings.find((r) => /(episode|event|af burden|vt|shock)/i.test(r.label))
  if (!entry) return "Captured in latest transmission"
  return `${entry.value}${entry.unit ? ` ${entry.unit}` : ""}`
}

function EcgSnapshot({ level }: { level: number }) {
  const stroke = level >= 9 ? "var(--danger)" : level >= 7 ? "var(--warning)" : "var(--accent)"
  const points =
    level >= 9
      ? "0,48 10,48 18,40 24,56 34,18 42,60 52,34 62,50 72,46 82,52 92,44 102,50 112,48 122,36 130,58 140,20 148,60 158,34 168,50 178,46 188,49 198,47"
      : "0,48 10,48 18,44 26,52 34,26 42,56 52,38 62,50 72,46 82,51 92,42 102,50 112,48 122,40 130,54 140,28 148,58 158,38 168,50 178,46 188,50 198,47"

  return (
    <svg viewBox="0 0 200 70" preserveAspectRatio="none" style={{ width: "100%", height: 96, display: "block", background: "rgba(247,250,255,0.95)" }}>
      <defs>
        <pattern id="ecg-grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(20, 15, 75, 0.08)" strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="200" height="70" fill="url(#ecg-grid)" />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

