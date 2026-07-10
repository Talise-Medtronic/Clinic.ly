import { useEffect, useMemo, useRef, useState } from "react"
import PatientHeader from "./PatientHeader"
import HomeTab from "./HomeTab"
import TrendsTab from "./TrendsTab"
import LogTab from "./LogTab"
import ProfileTab from "./ProfileTab"
import LogMascot from "./LogMascot"
import { patients } from "../../data/patients"
import patientEventsDb from "../../data/patient-events.json"
import { MedtronicGptConversation, type MedtronicGptConfig } from "../../services/medtronicGptClient"

type Tab = "home" | "trends" | "log" | "profile"
type CheckInStep = "welcome" | "analyzing" | "insights"

interface GeppoMessageList {
  messages: string[]
}

interface PatientEvent {
  eventId: string
  eventType: string
  localDate: string
  dayOfWeek: string
  localHour: number
  minutesSincePreviousEvent: number | null
}

interface PatientEventsRecord {
  patientId: string
  events: PatientEvent[]
}

interface PatientEventsDb {
  patients: PatientEventsRecord[]
}

const eventsDatabase = patientEventsDb as PatientEventsDb

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
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [checkInStep, setCheckInStep] = useState<CheckInStep>("welcome")
  const [checkInProgress, setCheckInProgress] = useState(0)
  const [trendMessages, setTrendMessages] = useState<string[]>([])
  const [currentTrendMessageIndex, setCurrentTrendMessageIndex] = useState(0)
  const [trendBusy, setTrendBusy] = useState(false)
  const [trendError, setTrendError] = useState<string | null>(null)
  const geppoConversationRef = useRef<MedtronicGptConversation | null>(null)

  const loggedInPatient = useMemo(
    () => patients.find((p) => p.name === "John Smith") ?? patients[0],
    [],
  )
  const patientEvents = useMemo(
    () => eventsDatabase.patients.find((entry) => entry.patientId === loggedInPatient.id)?.events ?? [],
    [loggedInPatient.id],
  )

  const trendSummary = useMemo(() => {
    const totalEvents = patientEvents.length
    const uniqueDays = new Set(patientEvents.map((ev) => ev.localDate)).size
    const morningEvents = patientEvents.filter((ev) => ev.localHour >= 6 && ev.localHour <= 11).length
    const avgGap = (() => {
      const gaps = patientEvents
        .map((ev) => ev.minutesSincePreviousEvent)
        .filter((value): value is number => typeof value === "number")
      if (gaps.length === 0) return null
      return Math.round(gaps.reduce((sum, value) => sum + value, 0) / gaps.length)
    })()

    return {
      totalEvents,
      uniqueDays,
      morningEvents,
      avgGap,
    }
  }, [patientEvents])

  useEffect(() => {
    const today = todayKey(new Date())
    const shouldMockJohnStreak = loggedInPatient.name === "John Smith"

    if (shouldMockJohnStreak) {
      const mockStreak = 35
      const mockLastLoggedDate = yesterdayKey(today)
      setStreak(mockStreak)
      setLastLoggedDate(mockLastLoggedDate)
      localStorage.setItem("patientStreak", String(mockStreak))
      localStorage.setItem("patientStreakDate", mockLastLoggedDate)
    } else {
      const storedStreak = Number(localStorage.getItem("patientStreak") || 0)
      const storedDate = localStorage.getItem("patientStreakDate") || ""
      setStreak(storedStreak)
      setLastLoggedDate(storedDate)
    }

    const lastCheckInDate = localStorage.getItem("patientDailyCheckInDate") || ""
    if (lastCheckInDate !== today) {
      setShowCheckInModal(true)
      setCheckInStep("welcome")
      setCheckInProgress(0)
    }
  }, [loggedInPatient.name])

  useEffect(() => {
    if (!trendBusy || checkInStep !== "analyzing") {
      return
    }

    setCheckInProgress(10)
    const id = window.setInterval(() => {
      setCheckInProgress((prev) => {
        if (prev >= 92) return prev
        return prev + Math.max(1, Math.round((95 - prev) / 7))
      })
    }, 180)

    return () => window.clearInterval(id)
  }, [trendBusy, checkInStep])

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

  function closeCheckInModal() {
    setShowCheckInModal(false)
    localStorage.setItem("patientDailyCheckInDate", todayKey(new Date()))
  }

  function replayCheckIn() {
    setShowCheckInModal(true)
    setCheckInStep("welcome")
    setCheckInProgress(0)
    setTrendError(null)
    setTrendMessages([])
    setCurrentTrendMessageIndex(0)
  }

  function fallbackTrendMessages(): string[] {
    const firstName = loggedInPatient.name.split(" ")[0]
    return [
      `Hi ${firstName}. I looked over your recent check-ins and I am proud of you for showing up today.`,
      `You logged ${trendSummary.totalEvents} heart-related events across ${trendSummary.uniqueDays} days. That gives us useful consistency to work with.`,
      `A lot of these happened in the morning (${trendSummary.morningEvents} events), so a calm morning routine could help you feel more prepared.`,
      `When events happened close together, they were about ${trendSummary.avgGap ?? "N/A"} minutes apart on average.`,
      "You are doing great. Keep logging daily, and I will keep translating your trends into simple guidance.",
    ]
  }

  function parseMessageList(rawReply: string): string[] {
    const trimmed = rawReply.trim()
    const cleaned = trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim()

    try {
      const parsed = JSON.parse(cleaned) as GeppoMessageList
      if (!parsed || !Array.isArray(parsed.messages)) {
        throw new Error("Response schema missing messages array")
      }

      const normalized = parsed.messages
        .filter((msg): msg is string => typeof msg === "string")
        .map((msg) => msg.trim())
        .filter((msg) => msg.length > 0)

      if (normalized.length === 0) {
        throw new Error("Response schema had empty messages array")
      }

      return normalized
    } catch {
      return fallbackTrendMessages()
    }
  }

  async function generatePatientTrendMessages() {
    const token = import.meta.env.VITE_MEDTRONIC_GPT_TOKEN
    if (!token) {
      return fallbackTrendMessages()
    }

    const configuredBaseUrl = import.meta.env.VITE_MEDTRONIC_GPT_RESPONSES_URL?.trim()
    const baseUrl = configuredBaseUrl && configuredBaseUrl.includes("api.gpt.medtronic.com")
      ? "/api/medtronic/responses"
      : configuredBaseUrl || "/api/medtronic/responses"

    const config: MedtronicGptConfig = {
      model: import.meta.env.VITE_MEDTRONIC_GPT_MODEL || "gpt-5.4",
      token,
      baseUrl,
    }

    if (!geppoConversationRef.current) {
      geppoConversationRef.current = new MedtronicGptConversation(config)
    }

    const promptPayload = {
      patient: {
        id: loggedInPatient.id,
        name: loggedInPatient.name,
        age: loggedInPatient.age,
      },
      streak,
      trendSummary,
      events: patientEvents,
    }

    const prompt = [
      "You are Dr Geppo, a caring digital health coach speaking directly to a patient.",
      "Explain trend patterns in warm, non-technical language. Keep it supportive and brief.",
      "Avoid medical jargon, avoid alarming tone, and do not overwhelm the patient.",
      "Respond in STRICT JSON using this exact schema and no additional keys:",
      '{"messages":["string"]}',
      "Rules:",
      "- messages must have 4 to 6 short strings",
      "- each string max 20 words",
      "- no markdown, no bullets, no code fences",
      "- plain text only",
      "",
      "Patient trend data:",
      JSON.stringify(promptPayload),
    ].join("\n")

    const result = await geppoConversationRef.current.send(prompt, {
      instructions: "Use plain-language, reassuring tone for patient-facing trend coaching.",
    })

    if (!result.reply) {
      return fallbackTrendMessages()
    }

    return parseMessageList(result.reply)
  }

  async function continueFromWelcome() {
    setCheckInStep("analyzing")
    setTrendError(null)
    setTrendBusy(true)
    setCurrentTrendMessageIndex(0)

    try {
      const messages = await generatePatientTrendMessages()
      setTrendMessages(messages)
      setCheckInProgress(100)
      window.setTimeout(() => {
        setCheckInStep("insights")
      }, 220)
    } catch (err) {
      console.error("[PatientPortal] Dr Geppo trend explanation failed", err)
      setTrendError(err instanceof Error ? err.message : "Unable to generate trend explanation")
      setTrendMessages(fallbackTrendMessages())
      setCheckInStep("insights")
    } finally {
      setTrendBusy(false)
    }
  }

  function advanceInsightMessage() {
    if (currentTrendMessageIndex >= trendMessages.length - 1) {
      closeCheckInModal()
      return
    }

    setCurrentTrendMessageIndex((prev) => prev + 1)
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
          boxShadow: "0 4px 12px rgba(20, 15, 75, 0.08)",
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
                minHeight: 52,
                padding: "11px 0 9px",
                background: "none",
                border: "none",
                borderBottom: active ? "2px solid #1010eb" : "2px solid transparent",
                color: active ? "#1010eb" : "rgba(43, 58, 92, 0.75)",
                transition: "all 160ms ease",
                cursor: "pointer",
              }}
            >
              {n.icon}
              <span style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: active ? 700 : 500, letterSpacing: "0.04em" }}>
                {n.label}
              </span>
            </button>
          )
        })}
      </nav>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }} className="animate-slide-up">
        {tab === "home" && (
          <div style={{ paddingBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 12px 0" }}>
              <button
                onClick={replayCheckIn}
                style={{
                  border: "1px solid rgba(20, 15, 75, 0.18)",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.92)",
                  color: "var(--text)",
                  fontFamily: "var(--sans)",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "7px 12px",
                  cursor: "pointer",
                  transition: "all 160ms ease",
                }}
              >
                Replay Dr Geppo Check-in
              </button>
            </div>
            <HomeTab streak={streak} />
          </div>
        )}
        {tab === "trends" && <TrendsTab />}
        {tab === "log" && <LogTab onLogSaved={handleLogSaved} />}
        {tab === "profile" && <ProfileTab />}
      </div>

      {showCheckInModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2200,
            background: "rgba(10, 15, 35, 0.52)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 14,
          }}
        >
          <div
            style={{
              width: "min(640px, 96vw)",
              height: "min(760px, 92vh)",
              borderRadius: 14,
              border: "1px solid rgba(20, 15, 75, 0.16)",
              background: "#ffffff",
              boxShadow: "0 24px 56px rgba(11, 18, 45, 0.35)",
              display: "grid",
              gridTemplateRows: "auto 1fr auto",
              overflow: "hidden",
              animation: "slide-up 260ms ease both",
            }}
          >
            <div style={{ padding: "16px 16px 10px", borderBottom: "1px solid rgba(20, 15, 75, 0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>
                  Daily Check-In
                </div>
                <div style={{ fontFamily: "var(--sans)", fontSize: 18, fontWeight: 700, color: "var(--text)" }}>
                  Dr Geppo
                </div>
              </div>
              <div style={{ width: 88, height: 88, flexShrink: 0 }}>
                <LogMascot mood="happy" />
              </div>
            </div>

            <div style={{ overflowY: "hidden", padding: "16px 18px" }}>
              {checkInStep === "welcome" && (
                <div className="animate-slide-up" style={{ display: "grid", gap: 12 }}>
                  <div style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
                    Hi {loggedInPatient.name.split(" ")[0]}! I am so glad to see you today.
                  </div>
                  <div style={{ fontFamily: "var(--sans)", fontSize: 13, lineHeight: 1.65, color: "var(--text-sub)" }}>
                    You are on a <strong>{streak} day streak</strong> of logging your health info. That consistency really helps your care team keep track of how you are doing.
                  </div>
                  <div style={{ fontFamily: "var(--sans)", fontSize: 13, lineHeight: 1.65, color: "var(--text-sub)" }}>
                    If you would like, I can quickly walk you through your recent trend patterns in a simple and supportive way.
                  </div>
                </div>
              )}

              {checkInStep === "analyzing" && (
                <div className="animate-slide-up" style={{ display: "grid", gap: 12 }}>
                  <div style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
                    Checking your recent trends...
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
                    <div style={{ width: 58, height: 58, flexShrink: 0 }}>
                      <LogMascot mood="thinking" />
                    </div>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        borderRadius: "14px 14px 14px 4px",
                        border: "1px solid rgba(20,15,75,0.14)",
                        background: "rgba(245,248,255,0.95)",
                        padding: "12px 14px",
                        fontFamily: "var(--sans)",
                        fontSize: 13,
                        lineHeight: 1.65,
                        color: "var(--text-sub)",
                      }}
                    >
                      I am reviewing your recent logs and preparing your check-in in short, simple parts.
                    </div>
                  </div>
                </div>
              )}

              {checkInStep === "insights" && (
                <div className="animate-slide-up" style={{ display: "grid", gap: 12 }}>
                  <div style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
                    Dr Geppo check-in
                  </div>
                  {trendError && (
                    <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--red)" }}>
                      {trendError}
                    </div>
                  )}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "74px minmax(0, 1fr)",
                      alignItems: "end",
                      gap: 16,
                    }}
                  >
                    <div style={{ width: 62, height: 62, flexShrink: 0, alignSelf: "end" }}>
                      <LogMascot mood="happy" />
                    </div>
                    <div
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: "14px 14px 14px 4px",
                        padding: "14px 16px",
                        background: "rgba(245,248,255,0.92)",
                        fontFamily: "var(--sans)",
                        fontSize: 14,
                        lineHeight: 1.62,
                        color: "var(--text-sub)",
                        minHeight: 84,
                        display: "flex",
                        alignItems: "center",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {trendMessages[currentTrendMessageIndex] || "I am gathering your update now."}
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-muted)", textAlign: "right" }}>
                    {trendMessages.length > 0 ? `${currentTrendMessageIndex + 1} / ${trendMessages.length}` : "1 / 1"}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(20, 15, 75, 0.1)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              {checkInStep === "welcome" && (
                <button
                  onClick={continueFromWelcome}
                  style={{
                    border: "1px solid rgba(20, 15, 75, 0.2)",
                    borderRadius: 8,
                    background: "var(--blue)",
                    color: "#fff",
                    fontFamily: "var(--sans)",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "7px 12px",
                    cursor: "pointer",
                  }}
                >
                  Continue
                </button>
              )}
              {checkInStep === "analyzing" && (
                <button
                  disabled
                  style={{
                    border: "1px solid rgba(20, 15, 75, 0.2)",
                    borderRadius: 8,
                    background: "rgba(16, 16, 235, 0.2)",
                    color: "rgba(20, 15, 75, 0.9)",
                    fontFamily: "var(--sans)",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "7px 12px",
                    cursor: "not-allowed",
                  }}
                >
                  Analyzing Trends
                </button>
              )}
              {checkInStep === "insights" && (
                <button
                  onClick={advanceInsightMessage}
                  style={{
                    border: "1px solid rgba(20, 15, 75, 0.2)",
                    borderRadius: 8,
                    background: "#fff",
                    color: "var(--text)",
                    fontFamily: "var(--sans)",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "7px 12px",
                    cursor: "pointer",
                  }}
                >
                  {currentTrendMessageIndex < trendMessages.length - 1 ? "I got it!" : "Continue"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
