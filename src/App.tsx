import { useState, useEffect } from "react"
import { patients } from "./data/patients"
import PatientCard from "./components/PatientCard"
import PatientDetail from "./components/PatientDetail"

const sorted = [...patients].sort((a, b) => b.alertLevel - a.alertLevel)

export default function App() {
  const [selectedId, setSelectedId] = useState<string>(sorted[0].id)
  const [mobileTab, setMobileTab] = useState<"list" | "detail">("list")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const selected = patients.find((p) => p.id === selectedId)!

  function handleSelect(id: string) {
    setSelectedId(id)
    if (isMobile) setMobileTab("detail")
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0f1e",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Top bar */}
      <header
        style={{
          padding: "0 20px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "linear-gradient(135deg, #1a6cf0 0%, #0d47a1 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2C8 2 3 6 3 10C3 12.76 5.24 15 8 15C10.76 15 13 12.76 13 10C13 6 8 2 8 2Z" fill="white" opacity="0.9" />
              <path d="M5.5 10H7.5V7H8.5V10H10.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: 17,
              color: "#e8eef7",
              letterSpacing: "-0.01em",
            }}
          >
            Clinic.ly
          </span>
        </div>

        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: "rgba(160,180,210,0.55)",
          }}
        >
          Dr. Petra Halvorsen · Cardiology
        </div>
      </header>

      {/* Mobile tabs */}
      {isMobile && (
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
          }}
        >
          {(["list", "detail"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              style={{
                flex: 1,
                padding: "10px 0",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: mobileTab === tab ? 600 : 400,
                color: mobileTab === tab ? "#4fc3f7" : "rgba(160,180,210,0.55)",
                borderBottom: mobileTab === tab ? "2px solid #4fc3f7" : "2px solid transparent",
                transition: "all 0.15s",
                textTransform: "capitalize",
              }}
            >
              {tab === "list" ? "Patients" : "Detail"}
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* Patient list */}
        {(!isMobile || mobileTab === "list") && (
          <div
            style={{
              width: isMobile ? "100%" : 300,
              flexShrink: 0,
              borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.07)",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              padding: "12px 8px",
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                fontWeight: 700,
                color: "rgba(130,155,190,0.5)",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                padding: "4px 8px 8px",
              }}
            >
              {sorted.length} Patients · Sorted by Alert
            </div>
            {sorted.map((p) => (
              <PatientCard
                key={p.id}
                patient={p}
                selected={p.id === selectedId}
                onClick={() => handleSelect(p.id)}
              />
            ))}
          </div>
        )}

        {/* Detail panel */}
        {(!isMobile || mobileTab === "detail") && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <PatientDetail patient={selected} />
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

        * { box-sizing: border-box; }

        body {
          margin: 0;
          background: #0a0f1e;
        }

        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.12);
          border-radius: 2px;
        }

        @keyframes pulse-border {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
