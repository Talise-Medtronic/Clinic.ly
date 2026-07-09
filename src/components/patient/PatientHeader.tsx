export default function PatientHeader() {
  const now = new Date()
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })

  return (
    <header
      style={{
        padding: "0 22px",
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(20, 15, 75, 0.12)",
        background: "rgba(255, 255, 255, 0.7)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--green)",
              animation: "pulse-ring 2s ease-in-out infinite",
            }}
          />
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--green)", letterSpacing: "0.06em", fontWeight: 700 }}>
            LIVE
          </span>
        </div>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-muted)" }}>
          {timeStr}
        </span>
      </div>

      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "linear-gradient(145deg, #140f4b 0%, #1010eb 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--sans)",
          fontSize: 12,
          fontWeight: 700,
          color: "#fff",
          boxShadow: "0 4px 10px rgba(20, 15, 75, 0.28)",
          letterSpacing: "0.04em",
        }}
      >
        JS
      </div>
    </header>
  )
}
