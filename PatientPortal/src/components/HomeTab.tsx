import { useState } from "react"
import ManagementCard from "./ManagementCard"

interface MetricCardProps {
  label: string
  value: string
  unit: string
  sub?: string
  color: string
  icon: React.ReactNode
  status?: "normal" | "caution" | "alert"
}

function MetricCard({ label, value, unit, sub, color, icon, status = "normal" }: MetricCardProps) {
  const statusColors = { normal: "var(--green)", caution: "var(--amber)", alert: "var(--red)" }
  const statusLabels = { normal: "Normal", caution: "Monitor", alert: "Alert" }

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ color }}>{icon}</div>
          <span style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            {label}
          </span>
        </div>
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
            fontWeight: 600,
            color: statusColors[status],
            letterSpacing: "0.08em",
            background: `${statusColors[status]}18`,
            padding: "2px 7px",
            borderRadius: 10,
          }}
        >
          {statusLabels[status]}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 32, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1 }}>
          {value}
        </span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--text-muted)" }}>{unit}</span>
      </div>
      {sub && <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--text-muted)" }}>{sub}</span>}
    </div>
  )
}

function HeartRateBar() {
  const beats = [72, 75, 70, 78, 74, 76, 71, 73, 77, 74, 72, 68, 75, 79, 74]
  const max = Math.max(...beats)

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 32 }}>
      {beats.map((b, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${(b / max) * 100}%`,
            background: i === beats.length - 1 ? "var(--blue-bright)" : "rgba(79,195,247,0.3)",
            borderRadius: 2,
            transition: "height 0.3s ease",
          }}
        />
      ))}
    </div>
  )
}

function AlertBanner() {
  return (
    <div
      style={{
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.25)",
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <div style={{ marginTop: 1 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--red)", marginBottom: 2 }}>Elevated Blood Pressure Detected</div>
        <div style={{ fontSize: 11, color: "rgba(239,68,68,0.7)" }}>Reading of 142/91 mmHg at 9:14 AM exceeded your target range. Dr. Halvorsen has been notified.</div>
      </div>
    </div>
  )
}

function RecentActivity() {
  const items = [
    { time: "9:14 AM", label: "BP reading synced", value: "142/91 mmHg", color: "var(--red)" },
    { time: "8:52 AM", label: "Heart rate synced", value: "74 bpm", color: "var(--green)" },
    { time: "8:30 AM", label: "Morning weight logged", value: "176.2 lbs", color: "var(--blue-bright)" },
    { time: "7:45 AM", label: "SpO₂ reading", value: "97%", color: "var(--green)" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "11px 0",
            borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none",
            gap: 12,
          }}
        >
          <div style={{ width: 3, height: 32, background: item.color, borderRadius: 2, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 500 }}>{item.label}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{item.time}</div>
          </div>
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, color: item.color }}>{item.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function HomeTab() {
  const [showAlert] = useState(true)

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      {/* Greeting */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: 4 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
          Good morning, Margaret
        </div>
        <div style={{ fontSize: 12, color: "var(--text-sub)", marginTop: 2 }}>
          Your device is syncing · Last update 4 min ago
        </div>
      </div>

      {/* Alert */}
      {showAlert && (
        <div style={{ marginBottom: 14 }}>
          <AlertBanner />
        </div>
      )}

      {/* Heart rate full-width */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Heart Rate
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div className="blink" style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--red)" }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--green)", letterSpacing: "0.06em" }}>LIVE</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 12 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 38, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.03em", lineHeight: 1 }}>74</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--text-muted)" }}>bpm</span>
          <span style={{ marginLeft: 8, fontSize: 10, fontFamily: "var(--mono)", background: "rgba(34,197,94,0.12)", color: "var(--green)", padding: "2px 8px", borderRadius: 10 }}>Normal</span>
        </div>
        <HeartRateBar />
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>Last 15 readings · Target: 60–100 bpm</div>
      </div>

      {/* 2-col metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <MetricCard
          label="Blood Pressure"
          value="142/91"
          unit="mmHg"
          sub="Target: <130/80"
          color="var(--red)"
          status="alert"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2z"/><path d="M12 12v10"/><path d="M8 18h8"/>
            </svg>
          }
        />
        <MetricCard
          label="SpO₂"
          value="97"
          unit="%"
          sub="Target: ≥95%"
          color="var(--cyan)"
          status="normal"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          }
        />
        <MetricCard
          label="Weight"
          value="176.2"
          unit="lbs"
          sub="+0.8 lbs vs yesterday"
          color="var(--blue-bright)"
          status="normal"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 1 3 3c0 1.66-3 5-3 5S9 6.66 9 5a3 3 0 0 1 3-3z"/><path d="M5 8h14l1 13H4L5 8z"/>
            </svg>
          }
        />
        <MetricCard
          label="Steps Today"
          value="4,218"
          unit=""
          sub="Goal: 5,000"
          color="var(--amber)"
          status="caution"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 4c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/><path d="M7.5 14l2-6 2.5 3 2-2.5 3 7.5"/>
            </svg>
          }
        />
      </div>

      {/* Recent activity */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 14,
        }}
      >
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
          Recent Activity
        </div>
        <RecentActivity />
      </div>

      {/* Management Cards */}
      <div style={{ marginBottom: 8 }}>
        <h3 style={{ fontSize: 12, fontFamily: "var(--mono)", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
          Quick Management
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          <ManagementCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            }
            title="Health Monitoring"
            description="Manage your readings"
            actions={[{ label: "View Dashboard" }, { label: "Export Data" }]}
            onAction={(action) => console.log("Action:", action)}
          />

          <ManagementCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" />
                <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24" />
              </svg>
            }
            title="Device Settings"
            description="Configure your devices"
            actions={[{ label: "Pair Device" }, { label: "Sync Now" }]}
            onAction={(action) => console.log("Action:", action)}
          />

          <ManagementCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
            title="Care Team"
            description="Manage access"
            actions={[{ label: "Invite Member" }, { label: "View Permissions" }]}
            onAction={(action) => console.log("Action:", action)}
          />
        </div>
      </div>
    </div>
  )
}
