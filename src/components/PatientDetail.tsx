import type { Patient } from "../data/patients"

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

      <SectionCard title="Application IDs" actions={<CardActions labels={["Edit", "Add"]} />}>
        <Row label="Primary App" value="Clinic Remote Monitor" />
        <Row label="App ID" value={`${patient.deviceId}-APP`} mono />
        <Row label="Integration" value="Rhythm Legacy Connector" />
      </SectionCard>

      <SectionCard title="Users" actions={<CardActions labels={["Edit", "Add"]} />}>
        <Row label="Attending" value="Dr. Geoff Martha" />
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
