import { useEffect, useState } from "react"
import PatientHeader from "./PatientHeader"
import HomeTab from "./HomeTab"
import TrendsTab from "./TrendsTab"
import LogTab from "./LogTab"
import ProfileTab from "./ProfileTab"

type Tab = "home" | "trends" | "log" | "profile"

const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "home",
    label: "Today",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: "trends",
    label: "Trends",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    id: "log",
    label: "Log",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profile",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
]

function todayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function yesterdayKey(date: string) {
  const d = new Date(date)
  d.setDate(d.getDate() - 1)
  return todayKey(d)
}

export default function PatientPortalApp({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("home")
  const [streak, setStreak] = useState(0)
  const [lastLoggedDate, setLastLoggedDate] = useState("")

  useEffect(() => {
    const storedStreak = Number(localStorage.getItem("patientStreak") || 0)
    const storedDate = localStorage.getItem("patientStreakDate") || ""
    setStreak(storedStreak)
    setLastLoggedDate(storedDate)
  }, [])

  function handleLogSaved() {
    const today = todayKey(new Date())
    if (today === lastLoggedDate) {
      return
    }

    const nextStreak = lastLoggedDate === yesterdayKey(today) ? Math.max(streak + 1, 1) : 1
    setStreak(nextStreak)
    setLastLoggedDate(today)
    localStorage.setItem("patientStreak", String(nextStreak))
    localStorage.setItem("patientStreakDate", today)
  }

  return (
    <div
      className="patient-portal"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100dvh - 66px)",
        background: "linear-gradient(180deg, #f4f7ff 0%, #ebf1fc 100%)",
      }}
    >
      {/* Horizontal tab bar at top */}
      <nav
        style={{
          flexShrink: 0,
          display: "flex",
          borderBottom: "1px solid rgba(20, 15, 75, 0.14)",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
        }}
      >
        {NAV.map((n) => {
          const active = tab === n.id
          return (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "10px 0 8px",
                background: "none",
                border: "none",
                borderBottom: active ? "2px solid #1010eb" : "2px solid transparent",
                color: active ? "#1010eb" : "rgba(53, 68, 105, 0.55)",
                transition: "color 0.15s, border-color 0.15s",
                cursor: "pointer",
              }}
            >
              {n.icon}
              <span style={{ fontFamily: "var(--sans)", fontSize: 10, fontWeight: active ? 700 : 400, letterSpacing: "0.04em" }}>
                {n.label}
              </span>
            </button>
          )
        })}
      </nav>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }} className="animate-slide-up">
        {tab === "home" && <HomeTab streak={streak} />}
        {tab === "trends" && <TrendsTab />}
        {tab === "log" && <LogTab streak={streak} onLogSaved={handleLogSaved} />}
        {tab === "profile" && <ProfileTab />}
      </div>
    </div>
  )
}
