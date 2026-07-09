export default function PatientHeader() {
  const now = new Date()
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })

  return (
    <header
      style={{
        padding: "0 18px",
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
        background: "var(--bg)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: "linear-gradient(135deg, #1a6cf0 0%, #0d47a1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 2C8 2 3 6 3 10C3 12.76 5.24 15 8 15C10.76 15 13 12.76 13 10C13 6 8 2 8 2Z" fill="white" opacity="0.9"/>
            <path d="M5.5 10H7.5V7H8.5V10H10.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text)", letterSpacing: "-0.01em" }}>
          Clinic.ly
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Live indicator */}
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
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--green)", letterSpacing: "0.06em" }}>
            LIVE
          </span>
        </div>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-muted)" }}>
          {timeStr}
        </span>
      </div>
    </header>
  )
}
