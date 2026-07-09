import type { Patient } from "../data/patients"

interface Props {
  patient: Patient
}

function alertColor(level: number): string {
  if (level >= 9) return "#ff3b3b"
  if (level >= 7) return "#ff8c00"
  if (level >= 5) return "#f5c518"
  if (level >= 3) return "#4fc3f7"
  return "#4caf80"
}

function alertLabel(level: number): string {
  if (level >= 9) return "CRITICAL"
  if (level >= 7) return "HIGH"
  if (level >= 5) return "MODERATE"
  if (level >= 3) return "LOW"
  return "STABLE"
}

export default function PatientDetail({ patient }: Props) {
  const color = alertColor(patient.alertLevel)
  const isCritical = patient.alertLevel >= 9

  return (
    <div
      style={{
        padding: "24px 20px",
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
          <div>
            <h2
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                color: "#e8eef7",
                margin: 0,
                marginBottom: 4,
              }}
            >
              {patient.name}
            </h2>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: "rgba(180,195,220,0.55)",
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
                color: patient.alertLevel >= 9 ? "#fff" : "#0a0f1e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 20,
                fontWeight: 700,
                boxShadow: isCritical ? `0 0 20px ${color}` : "none",
              }}
            >
              {patient.alertLevel}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
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
            background: `rgba(${isCritical ? "255,59,59" : patient.alertLevel >= 7 ? "255,140,0" : patient.alertLevel >= 5 ? "245,197,24" : "79,195,247"},0.08)`,
            borderRadius: 8,
            padding: "12px 14px",
            borderLeft: `3px solid ${color}`,
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
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
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              color: "rgba(200,215,235,0.80)",
              lineHeight: 1.55,
            }}
          >
            {patient.alertDescription}
          </div>
        </div>
      </div>

      {/* Device info */}
      <section>
        <SectionLabel>Device</SectionLabel>
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: 8,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <Row label="Model" value={patient.deviceModel} />
          <Row label="Device ID" value={patient.deviceId} mono />
          <Row label="Implant Date" value={patient.implantDate} mono />
        </div>
      </section>

      {/* Readings */}
      <section>
        <SectionLabel>Live Readings</SectionLabel>
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
                background: "rgba(255,255,255,0.04)",
                borderRadius: 8,
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: "rgba(160,180,210,0.55)",
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {r.label}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#e8eef7",
                  lineHeight: 1,
                }}
              >
                {r.value}
                {r.unit && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 400,
                      color: "rgba(160,180,210,0.6)",
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
      </section>

      {/* Clinical notes */}
      <section>
        <SectionLabel>Clinical Notes</SectionLabel>
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: 8,
            padding: "12px 14px",
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: "rgba(200,215,235,0.80)",
            lineHeight: 1.65,
          }}
        >
          {patient.clinicalNotes}
        </div>
      </section>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        fontWeight: 700,
        color: "rgba(130,155,190,0.7)",
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: "rgba(160,180,210,0.55)",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: mono ? "'JetBrains Mono', monospace" : "'Inter', sans-serif",
          fontSize: mono ? 12 : 13,
          color: "#c8d7eb",
          textAlign: "right",
          wordBreak: "break-all",
        }}
      >
        {value}
      </span>
    </div>
  )
}
