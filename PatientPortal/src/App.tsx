import { useState } from "react"
import PatientHeader from "./components/PatientHeader"
import HomeTab from "./components/HomeTab"
import TrendsTab from "./components/TrendsTab"
import LogTab from "./components/LogTab"
import ProfileTab from "./components/ProfileTab"

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

export default function App() {
  const [tab, setTab] = useState<Tab>("home")

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", maxWidth: 430, margin: "0 auto", background: "var(--bg)", position: "relative" }}>
      <PatientHeader />

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }} className="animate-slide-up">
        {tab === "home" && <HomeTab />}
        {tab === "trends" && <TrendsTab />}
        {tab === "log" && <LogTab />}
        {tab === "profile" && <ProfileTab />}
      </div>

      <nav
        style={{
          flexShrink: 0,
          display: "flex",
          borderTop: "1px solid var(--border)",
          background: "rgba(248,250,252,0.97)",
          backdropFilter: "blur(12px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
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
                color: active ? "var(--blue-bright)" : "var(--text-muted)",
                transition: "color 0.15s",
              }}
            >
              {n.icon}
              <span style={{ fontFamily: "var(--sans)", fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: "0.04em" }}>
                {n.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
