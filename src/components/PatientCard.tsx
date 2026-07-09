import type { Patient } from "../data/patients"

interface Props {
  patient: Patient
  selected: boolean
  onClick: () => void
}

function alertColor(level: number): string {
  if (level >= 9) return "#ff3b3b"
  if (level >= 7) return "#ff8c00"
  if (level >= 5) return "#f5c518"
  if (level >= 3) return "#4fc3f7"
  return "#4caf80"
}

function alertBg(level: number): string {
  if (level >= 9) return "rgba(255,59,59,0.10)"
  if (level >= 7) return "rgba(255,140,0,0.10)"
  if (level >= 5) return "rgba(245,197,24,0.08)"
  if (level >= 3) return "rgba(79,195,247,0.08)"
  return "rgba(76,175,128,0.08)"
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
          ? "rgba(255,255,255,0.07)"
          : alertBg(patient.alertLevel),
        border: "none",
        borderLeft: `3px solid ${color}`,
        borderRadius: "0 6px 6px 0",
        padding: "14px 16px",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.15s",
        animation: isCritical ? "pulse-border 1.8s ease-in-out infinite" : "none",
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
          color: patient.alertLevel >= 9 ? "#fff" : "#0a0f1e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          fontWeight: 700,
          boxShadow: isCritical ? `0 0 10px ${color}` : "none",
        }}
      >
        {patient.alertLevel}
      </div>

      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          color: "#e8eef7",
          marginBottom: 2,
          paddingRight: 36,
        }}
      >
        {patient.name}
      </div>

      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: "rgba(180,195,220,0.65)",
          marginBottom: 6,
        }}
      >
        {patient.age}y · {patient.deviceModel.replace("Medtronic ", "")}
      </div>

      <div
        style={{
          fontFamily: "'Inter', sans-serif",
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
