import type { Patient } from "../data/patients"

interface Props {
  patient: Patient
  selected: boolean
  onClick: () => void
}

function alertColor(level: number): string {
  if (level >= 9) return "var(--danger)"
  if (level >= 7) return "var(--warning)"
  if (level >= 5) return "#8f6d1a"
  if (level >= 3) return "var(--accent)"
  return "var(--ok)"
}

function alertBg(level: number): string {
  if (level >= 9) return "rgba(209, 73, 47, 0.1)"
  if (level >= 7) return "rgba(255, 184, 28, 0.16)"
  if (level >= 5) return "rgba(0, 94, 184, 0.08)"
  if (level >= 3) return "rgba(0, 169, 224, 0.1)"
  return "rgba(0, 139, 93, 0.08)"
}

export default function PatientCard({ patient, selected, onClick }: Props) {
  const color = alertColor(patient.alertLevel)
  const isCritical = patient.alertLevel >= 9

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        background: selected
          ? "rgba(255,255,255,0.9)"
          : alertBg(patient.alertLevel),
        border: "1px solid rgba(0, 79, 154, 0.16)",
        borderLeft: `3px solid ${color}`,
        borderRadius: "10px",
        padding: "14px 16px",
        cursor: "pointer",
        position: "relative",
        transition: "all 0.2s ease",
        animation: isCritical ? "pulse-border 2.6s ease-in-out infinite" : "none",
        boxShadow: selected ? "0 8px 18px rgba(0, 57, 107, 0.12)" : "none",
      }}
    >
      {/* Alert level badge */}
      <div
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: color,
          color: "#f7fffc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          fontWeight: 700,
          boxShadow: isCritical ? `0 0 10px ${color}` : "none",
        }}
      >
        {patient.alertLevel}
      </div>

      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-strong)",
          marginBottom: 2,
          paddingRight: 36,
        }}
      >
        {patient.name}
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--text-subtle)",
          marginBottom: 6,
        }}
      >
        {patient.age}y · {patient.deviceModel.replace("Medtronic ", "")}
      </div>

      <div
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: 12,
          color: color,
          fontWeight: 500,
        }}
      >
        {patient.alertTitle}
      </div>
    </button>
  )
}
