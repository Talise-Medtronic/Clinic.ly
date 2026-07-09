interface ExpiredFlagProps {
  isExpired: boolean
  expirationDate?: string
  message?: string
}

export default function ExpiredFlag({ isExpired, expirationDate, message }: ExpiredFlagProps) {
  if (!isExpired) return null

  return (
    <div
      style={{
        background: "rgba(239, 68, 68, 0.08)",
        border: "1px solid rgba(239, 68, 68, 0.25)",
        borderRadius: 8,
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--red)" }}>Expired</div>
        {expirationDate && <div style={{ fontSize: 10, color: "rgba(239, 68, 68, 0.7)", marginTop: 2 }}>Expired on {expirationDate}</div>}
        {message && <div style={{ fontSize: 10, color: "rgba(239, 68, 68, 0.7)", marginTop: 2 }}>{message}</div>}
      </div>
    </div>
  )
}
