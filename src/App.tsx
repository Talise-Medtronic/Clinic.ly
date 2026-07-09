import { useState, useEffect, useMemo, type CSSProperties } from "react"
import { patients } from "./data/patients"
import PatientDetail from "./components/PatientDetail"
import PatientPortalApp from "./components/patient/PatientPortalApp"

const sorted = [...patients].sort((a, b) => b.alertLevel - a.alertLevel)
type AppView = "home" | "patients" | "administrator" | "patient-portal"
type AlertFilter = "all" | "critical" | "high" | "moderate" | "stable"
type ScoreFilter = "all" | 10 | 9 | 8 | 7 | 6 | 5 | 4 | 3 | 2 | 1
type WarningSourceFilter = "all" | "heart" | "device"

export default function App() {
  const [selectedId, setSelectedId] = useState<string>(sorted[0].id)
  const [view, setView] = useState<AppView>("patients")
  const [mobileTab, setMobileTab] = useState<"list" | "detail">("detail")
  const [isMobile, setIsMobile] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [alertFilter, setAlertFilter] = useState<AlertFilter>("all")
  const [warningSourceFilter, setWarningSourceFilter] = useState<WarningSourceFilter>("all")
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all")
  const [doctorMenuOpen, setDoctorMenuOpen] = useState(false)
  const [clinicalNotesById, setClinicalNotesById] = useState<Record<string, string>>(() =>
    Object.fromEntries(patients.map((p) => [p.id, p.clinicalNotes])),
  )

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const selected = patients.find((p) => p.id === selectedId)!
  const selectedWithNotes = {
    ...selected,
    clinicalNotes: clinicalNotesById[selected.id] ?? selected.clinicalNotes,
  }

  const filteredSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return sorted.filter((p) => {
      const source = warningSource(p)
      if (
        (alertFilter === "critical" && p.alertLevel < 9) ||
        (alertFilter === "high" && (p.alertLevel < 7 || p.alertLevel > 8)) ||
        (alertFilter === "moderate" && (p.alertLevel < 5 || p.alertLevel > 6)) ||
        (alertFilter === "stable" && p.alertLevel > 2)
      ) {
        return false
      }
      if (warningSourceFilter !== "all" && source !== warningSourceFilter) return false
      if (scoreFilter !== "all" && p.alertLevel !== scoreFilter) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.deviceModel.toLowerCase().includes(q) ||
        p.alertTitle.toLowerCase().includes(q) ||
        p.deviceId.toLowerCase().includes(q)
      )
    })
  }, [searchQuery, alertFilter, warningSourceFilter, scoreFilter])

  function handleSelect(id: string) {
    setSelectedId(id)
    if (isMobile) setMobileTab("detail")
  }

  function handleClinicalNotesChange(nextValue: string) {
    setClinicalNotesById((prev) => ({ ...prev, [selectedId]: nextValue }))
  }

  function batteryLife(patientId: string): string {
    const patient = patients.find((p) => p.id === patientId)
    const life = patient?.readings.find((r) => r.label.toLowerCase().includes("battery life"))
    if (!life) return "n/a"
    return `${life.value}${life.unit ? ` ${life.unit}` : ""}`
  }

  if (view === "patient-portal") {
    return (
      <>
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            height: 66,
            background: "rgba(255,255,255,0.9)",
            borderBottom: "1px solid rgba(20,15,75,0.18)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 22px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "linear-gradient(145deg, #140f4b 0%, #1010eb 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 16px rgba(20, 15, 75, 0.28)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2C8 2 3 6 3 10C3 12.76 5.24 15 8 15C10.76 15 13 12.76 13 10C13 6 8 2 8 2Z" fill="white" opacity="0.9" />
                <path d="M5.5 10H7.5V7H8.5V10H10.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 17,
                color: "var(--navy-fill)",
                letterSpacing: "0.01em",
              }}
            >
              Clinic.ly
            </span>
            <span
              style={{
                fontFamily: "'Avenir Next World', 'Avenir Next', sans-serif",
                fontSize: 12,
                color: "#39476f",
              }}
            >
              John Smith &middot; Patient
            </span>
          </div>
          <button
            onClick={() => setView("patients")}
            style={{
              border: "1px solid rgba(0, 79, 154, 0.22)",
              background: "rgba(255,255,255,0.9)",
              color: "#39476f",
              borderRadius: 8,
              padding: "5px 10px",
              fontFamily: "'Avenir Next World', 'Avenir Next', sans-serif",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Doctor Portal
          </button>
        </div>
        <div style={{ paddingTop: 66 }}>
          <PatientPortalApp onBack={() => setView("patients")} />
        </div>
      </>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-main)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-ui)",
        position: "relative",
        isolation: "isolate",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background:
            "linear-gradient(180deg, #f4f7ff 0%, #ebf1fc 100%)",
        }}
      />

      <header
        style={{
          padding: "0 22px",
          height: 66,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(20, 15, 75, 0.18)",
          background: "rgba(255, 255, 255, 0.9)",
          flexShrink: 0,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "linear-gradient(145deg, #140f4b 0%, #1010eb 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 16px rgba(20, 15, 75, 0.28)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 2C8 2 3 6 3 10C3 12.76 5.24 15 8 15C10.76 15 13 12.76 13 10C13 6 8 2 8 2Z" fill="white" opacity="0.9" />
              <path d="M5.5 10H7.5V7H8.5V10H10.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 17,
              color: "var(--navy-fill)",
              letterSpacing: "0.01em",
            }}
          >
            Clinic.ly
          </span>
          <button
            onClick={() => setView(view === "patient-portal" ? "patients" : "patient-portal")}
            style={{
              border: "1px solid rgba(0, 79, 154, 0.22)",
              background: "rgba(255,255,255,0.9)",
              color: "var(--text-mid)",
              borderRadius: 8,
              padding: "5px 10px",
              fontFamily: "var(--font-ui)",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Patient Portal
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
          <div
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: 12,
              color: "var(--text-mid)",
            }}
          >
            Dr Doof &middot; Cardiology
          </div>

          <button
            onClick={() => setDoctorMenuOpen((v) => !v)}
            style={{
              border: "1px solid rgba(0, 79, 154, 0.22)",
              background: "rgba(255, 255, 255, 0.9)",
              borderRadius: 999,
              width: 34,
              height: 34,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0, 57, 107, 0.14)",
            }}
            aria-label="Open doctor menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5" stroke="var(--primary-base)" strokeWidth="1.8" />
              <path d="M5 19C5.8 15.9 8.3 14.3 12 14.3C15.7 14.3 18.2 15.9 19 19" stroke="var(--primary-base)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          {doctorMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: 42,
                right: 0,
                width: 190,
                background: "rgba(255,255,255,0.98)",
                border: "1px solid rgba(0, 79, 154, 0.2)",
                borderRadius: 10,
                boxShadow: "0 14px 24px rgba(0, 40, 84, 0.16)",
                overflow: "hidden",
              }}
            >
              <MenuItem label="Doctor Profile" onClick={() => setDoctorMenuOpen(false)} />
              <MenuItem label="Add New Patient" onClick={() => setDoctorMenuOpen(false)} />
            </div>
          )}
        </div>
      </header>

      {isMobile && view === "patients" && (
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(20, 15, 75, 0.15)",
            background: "rgba(255, 255, 255, 0.72)",
            flexShrink: 0,
            position: "relative",
            zIndex: 1,
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
                fontFamily: "var(--font-display)",
                fontSize: 13,
                fontWeight: mobileTab === tab ? 600 : 400,
                color: mobileTab === tab ? "var(--primary-base)" : "var(--text-subtle)",
                borderBottom: mobileTab === tab ? "2px solid var(--primary-base)" : "2px solid transparent",
                transition: "all 0.18s",
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
          position: "relative",
          zIndex: 1,
          padding: 12,
          gap: 12,
        }}
      >
        {view === "home" && (
          <section style={{ flex: 1, overflowY: "auto", padding: 4 }}>
            <div
              style={{
                border: "1px solid rgba(20, 15, 75, 0.14)",
                background: "rgba(255,255,255,0.9)",
                borderRadius: 12,
                padding: "18px 18px 14px",
                marginBottom: 12,
              }}
            >
              <div style={{ fontFamily: "var(--font-display)", fontSize: 21, color: "var(--navy-fill)", fontWeight: 700 }}>
                Welcome, Dr Doof
              </div>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--text-mid)", marginTop: 6 }}>
                StudySync-style dashboard for remote cardiac device management.
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: 12,
              }}
            >
              <HomeCard title="Special Use Management" subtitle="Review patient alerts and filter by severity" accent="var(--primary-base)" />
              <HomeCard title="Tablet Management" subtitle="Configure bedside tablet cohorts" accent="var(--electric-blue-80)" />
              <HomeCard title="Content Management" subtitle="Maintain protocol documents and updates" accent="var(--tertiary-base)" />
              <HomeCard title="User Management" subtitle="Manage clinicians, roles, and access" accent="var(--navy-fill)" />
            </div>
          </section>
        )}

        {view === "administrator" && (
          <section style={{ flex: 1, overflowY: "auto", padding: 4 }}>
            <div style={{ border: "1px solid rgba(20, 15, 75, 0.14)", background: "rgba(255,255,255,0.9)", borderRadius: 12, padding: 18 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--navy-fill)", fontWeight: 700, marginBottom: 8 }}>
                Administrator
              </div>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--text-mid)" }}>
                This route is reserved for StudySync administrator workflows.
              </div>
            </div>
          </section>
        )}

        {view === "patients" && (!isMobile || mobileTab === "list") && (
          <div
            style={{
              width: isMobile ? "100%" : 520,
              flexShrink: 0,
              border: "1px solid rgba(20, 15, 75, 0.14)",
              background: "rgba(255,255,255,0.84)",
              borderRadius: 12,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            <div
              style={{
                padding: "14px 14px 10px",
                borderBottom: "1px solid rgba(20, 15, 75, 0.12)",
              }}
            >
              <div style={{ fontFamily: "var(--font-display)", fontSize: 17, color: "var(--navy-fill)", fontWeight: 700, marginBottom: 10 }}>
                Doctor Portal
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    border: "1px solid rgba(20, 15, 75, 0.2)",
                    background: "rgba(255,255,255,0.95)",
                    borderRadius: 9,
                    padding: "8px 10px",
                    flex: 1,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="11" cy="11" r="6.5" stroke="var(--primary-base)" strokeWidth="1.8" />
                    <path d="M16 16L21 21" stroke="var(--primary-base)" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    style={{
                      border: "none",
                      outline: "none",
                      width: "100%",
                      fontFamily: "var(--font-ui)",
                      fontSize: 12,
                      color: "var(--text-strong)",
                      background: "transparent",
                    }}
                  />
                </div>

                <button
                  onClick={() => setShowFilters((v) => !v)}
                  style={toolbarButtonStyle}
                >
                  Filter
                </button>

                <button style={{ ...toolbarButtonStyle, background: "var(--primary-base)", color: "#fff", borderColor: "var(--primary-base)" }}>
                  + Add
                </button>
              </div>

              {showFilters && (
                <div style={{ marginTop: 10, border: "1px solid rgba(20, 15, 75, 0.14)", borderRadius: 10, padding: 10, background: "rgba(245,248,255,0.95)" }}>
                  <div style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, color: "var(--text-mid)", marginBottom: 6 }}>
                    Warning Source
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {(["all", "heart", "device"] as const).map((item) => (
                      <button
                        key={item}
                        onClick={() => setWarningSourceFilter(item)}
                        style={{
                          border: "1px solid rgba(20, 15, 75, 0.18)",
                          background: warningSourceFilter === item ? "rgba(16, 16, 235, 0.12)" : "#fff",
                          color: warningSourceFilter === item ? "var(--primary-base)" : "var(--text-mid)",
                          borderRadius: 999,
                          padding: "5px 10px",
                          fontFamily: "var(--font-ui)",
                          fontSize: 11,
                          cursor: "pointer",
                          textTransform: item === "all" ? "capitalize" : "none",
                        }}
                      >
                        {item === "heart" ? "♥" : item === "device" ? "⚙" : "all"}
                      </button>
                    ))}
                  </div>

                  <div style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, color: "var(--text-mid)", marginBottom: 6 }}>
                    Warning Level
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {(["all", "critical", "high", "moderate", "stable"] as const).map((item) => (
                      <button
                        key={item}
                        onClick={() => setAlertFilter(item)}
                        style={{
                          border: "1px solid rgba(20, 15, 75, 0.18)",
                          background: alertFilter === item ? "rgba(16, 16, 235, 0.12)" : "#fff",
                          color: alertFilter === item ? "var(--primary-base)" : "var(--text-mid)",
                          borderRadius: 999,
                          padding: "5px 10px",
                          fontFamily: "var(--font-ui)",
                          fontSize: 11,
                          cursor: "pointer",
                          textTransform: "capitalize",
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>

                  <div style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, color: "var(--text-mid)", marginBottom: 6 }}>
                    Score
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {(["all", 10, 9, 8, 7, 6, 5, 4, 3, 2, 1] as const).map((score) => (
                      <button
                        key={String(score)}
                        onClick={() => setScoreFilter(score)}
                        style={{
                          border: "1px solid rgba(20, 15, 75, 0.18)",
                          background: scoreFilter === score ? "rgba(16, 16, 235, 0.12)" : "#fff",
                          color: scoreFilter === score ? "var(--primary-base)" : score === "all" ? "var(--text-mid)" : scoreColor(score),
                          borderRadius: 999,
                          padding: "5px 10px",
                          fontFamily: "var(--font-ui)",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          textTransform: score === "all" ? "capitalize" : "none",
                        }}
                      >
                        {score}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={toolbarButtonStyle} onClick={() => setShowFilters(false)}>Apply</button>
                    <button
                      style={toolbarButtonStyle}
                      onClick={() => {
                        setAlertFilter("all")
                        setWarningSourceFilter("all")
                        setScoreFilter("all")
                        setSearchQuery("")
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: "8px 10px 12px" }}>
              <div style={{ border: "1px solid rgba(20, 15, 75, 0.12)", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
                <TableHeader />
                {filteredSorted.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p.id)}
                    style={{
                      width: "100%",
                      border: "none",
                      borderTop: "1px solid rgba(20, 15, 75, 0.1)",
                      background: p.id === selectedId ? "rgba(16, 16, 235, 0.07)" : "#fff",
                      cursor: "pointer",
                      padding: "0",
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.8fr 0.8fr 0.6fr", padding: "10px 10px", alignItems: "center", gap: 8, textAlign: "left" }}>
                      <div style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--text-strong)", fontWeight: 600 }}>{p.name}</div>
                      <WarningTypeCell patient={p} />
                      <div style={{ fontFamily: "var(--font-ui)", fontSize: 11, color: "var(--text-mid)" }}>{batteryLife(p.id)}</div>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <span
                          style={{
                            color: scoreColor(p.alertLevel),
                            fontFamily: "var(--font-ui)",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {p.alertLevel}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {filteredSorted.length === 0 && (
              <div
                style={{
                  padding: "4px 14px 14px",
                  fontFamily: "var(--font-ui)",
                  fontSize: 12,
                  color: "var(--text-subtle)",
                }}
              >
                No rows found. Adjust filters or add a new patient.
              </div>
            )}
          </div>
        )}

        {view === "patients" && (!isMobile || mobileTab === "detail") && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <PatientDetail
              patient={selectedWithNotes}
              onClinicalNotesChange={handleClinicalNotesChange}
            />
          </div>
        )}
      </div>

      <style>{`
        :root {
          --font-display: 'Avenir Next World', 'Avenir Next', 'Segoe UI', sans-serif;
          --font-ui: 'Avenir Next World', 'Avenir Next', 'Segoe UI', sans-serif;
          --font-mono: 'Avenir Next World', 'Avenir Next', 'Segoe UI', sans-serif;
          --bg-main: #edf2fb;
          --surface-soft: rgba(255,255,255,0.72);
          --surface-card: rgba(255,255,255,0.84);
          --text-strong: #1a1f31;
          --text-mid: #39476f;
          --text-subtle: rgba(53, 68, 105, 0.68);
          --navy-fill: #140f4b;
          --electric-blue-80: #0c0ca5;
          --primary-base: #1010eb;
          --tertiary-base: #cd0025;
          --accent: #1010eb;
          --accent-2: #0c0ca5;
          --danger: #cd0025;
          --warning: #cb8a00;
          --ok: #008b5d;
        }

        * { box-sizing: border-box; }

        body {
          margin: 0;
          background: var(--bg-main);
          color: var(--text-strong);
        }

        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(20, 15, 75, 0.28);
          border-radius: 99px;
        }

        @keyframes pulse-border {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        @keyframes panel-rise {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        border: "none",
        textAlign: "left",
        padding: "10px 12px",
        fontFamily: "var(--font-ui)",
        fontSize: 12,
        color: "var(--text-mid)",
        background: "transparent",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  )
}

const toolbarButtonStyle: CSSProperties = {
  border: "1px solid rgba(20, 15, 75, 0.2)",
  background: "#fff",
  color: "var(--text-mid)",
  borderRadius: 8,
  padding: "7px 11px",
  fontFamily: "var(--font-ui)",
  fontSize: 12,
  cursor: "pointer",
}

function HomeCard({ title, subtitle, accent }: { title: string; subtitle: string; accent: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(20, 15, 75, 0.14)",
        background: "rgba(255,255,255,0.92)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div style={{ height: 4, background: accent }} />
      <div style={{ padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: accent,
              opacity: 0.22,
              display: "inline-block",
            }}
          />
          <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "var(--navy-fill)" }}>
            {title}
          </div>
        </div>
        <div style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--text-mid)", marginBottom: 10 }}>{subtitle}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={toolbarButtonStyle}>Open</button>
          <button style={toolbarButtonStyle}>Details</button>
        </div>
      </div>
    </div>
  )
}

function TableHeader() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.3fr 0.8fr 0.8fr 0.6fr",
        gap: 8,
        padding: "9px 10px",
        background: "rgba(20, 15, 75, 0.04)",
      }}
    >
      <TableHeaderCell label="Name" />
      <TableHeaderCell label="Type" />
      <TableHeaderCell label="Battery Left" />
      <TableHeaderCell label="Score" align="right" />
    </div>
  )
}

function TableHeaderCell({ label, align = "left" }: { label: string; align?: "left" | "right" }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "var(--text-subtle)",
        fontWeight: 600,
        textAlign: align,
      }}
    >
      {label}
    </div>
  )
}

function WarningTypeCell({ patient }: { patient: (typeof patients)[number] }) {
  const source = warningSource(patient)
  const sourceSymbol = source === "heart" ? "♥" : "⚙"
  const detail = warningSubtype(patient)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <div style={{ fontFamily: "var(--font-ui)", fontSize: 11, color: "var(--text-mid)", fontWeight: 600 }}>
        {sourceSymbol} - {severity(patient.alertLevel)}
      </div>
      <div style={{ fontFamily: "var(--font-ui)", fontSize: 10, color: "var(--text-subtle)" }}>{detail}</div>
    </div>
  )
}

function warningSource(patient: (typeof patients)[number]): "heart" | "device" {
  const text = `${patient.alertTitle} ${patient.alertDescription}`.toLowerCase()
  const heartSignals = ["af", "atrial", "ventricular", "vt", "tachy", "arrhythm", "rhythm"]
  if (heartSignals.some((k) => text.includes(k))) return "heart"
  return "device"
}

function warningSubtype(patient: (typeof patients)[number]): string {
  const text = `${patient.alertTitle} ${patient.alertDescription}`.toLowerCase()
  if (warningSource(patient) === "heart") {
    if (text.includes("af")) return "Atrial fibrillation"
    if (text.includes("vt") || text.includes("ventricular")) return "Ventricular rhythm"
    return "Rhythm event"
  }
  if (text.includes("battery")) return "Battery"
  if (text.includes("impedance") || text.includes("lead")) return "Lead and impedance"
  if (text.includes("sensing") || text.includes("threshold") || text.includes("amplitude")) return "Sensing and readings"
  return "Device telemetry"
}

function severity(level: number): string {
  if (level >= 9) return "Critical"
  if (level >= 7) return "High"
  if (level >= 5) return "Moderate"
  if (level >= 3) return "Low"
  return "Stable"
}

function scoreColor(level: number): string {
  if (level >= 9) return "var(--danger)"
  if (level >= 7) return "var(--warning)"
  if (level >= 5) return "var(--primary-base)"
  if (level >= 3) return "var(--electric-blue-80)"
  return "var(--ok)"
}
