import { useMemo, useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import type { Patient } from "../data/patients"
import {
  getVitals,
  higherIsWorse,
  type TrendDirection,
  type VitalSeries,
  type VitalStatus,
} from "../data/vitals"
import { ecgExamples } from "../data/ecg"
import { ecgIngestionService } from "../services/ecgIngestionService"
import { MedtronicGptConversation, type MedtronicGptConfig } from "../services/medtronicGptClient"
import patientEventsDb from "../data/patient-events.json"

interface Props {
  patient: Patient
  onClinicalNotesChange: (value: string) => void
}

type DetailTab = "events" | "profile" | "vitals" | "trends" | "notes"

interface PatientEvent {
  eventId: string
  eventType: string
  severity: number
  occurredAtUtc: string
  localDate: string
  localTime: string
  localHour: number
  dayOfWeek: string
  timeBucket: string
  minutesSincePreviousEvent: number | null
  source: string
  actionTaken: string
  resolved: boolean
  tags: string[]
}

interface PatientEventsRecord {
  patientId: string
  deviceId: string
  events: PatientEvent[]
}

interface PatientEventsDb {
  patients: PatientEventsRecord[]
}

const eventsDatabase = patientEventsDb as PatientEventsDb
const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

function alertColor(level: number): string {
  if (level >= 9) return "var(--danger)"
  if (level >= 7) return "var(--warning)"
  if (level >= 5) return "var(--accent)"
  if (level >= 3) return "var(--accent-2)"
  return "var(--ok)"
}

function alertLabel(level: number): string {
  if (level >= 9) return "CRITICAL"
  if (level >= 7) return "HIGH"
  if (level >= 5) return "MODERATE"
  if (level >= 3) return "LOW"
  return "STABLE"
}

export default function PatientDetail({ patient, onClinicalNotesChange }: Props) {
  const color = alertColor(patient.alertLevel)
  const isCritical = patient.alertLevel >= 9
  const isAbnormalRhythm = hasAbnormalRhythm(patient)
  const eventTimeLabel = useMemo(() => getEventTimeLabel(patient), [patient])
  const [activeTab, setActiveTab] = useState<DetailTab>("events")
  const [confirmedByPatientId, setConfirmedByPatientId] = useState<Record<string, boolean>>({})
  const [declinedByPatientId, setDeclinedByPatientId] = useState<Record<string, boolean>>({})
  const [analysisByPatientId, setAnalysisByPatientId] = useState<Record<string, string>>({})
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisBusy, setAnalysisBusy] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const conversationsRef = useRef<Record<string, MedtronicGptConversation>>({})
  const analysisContentRef = useRef<HTMLDivElement | null>(null)
  const isConfirmed = !!confirmedByPatientId[patient.id]
  const isDeclined = !!declinedByPatientId[patient.id]
  const analysisText = analysisByPatientId[patient.id] ?? ""
  const patientEventRecord = useMemo(
    () => eventsDatabase.patients.find((entry) => entry.patientId === patient.id),
    [patient.id],
  )
  const patientEvents = patientEventRecord?.events ?? []

  const trendSummary = useMemo(() => {
    const totalEvents = patientEvents.length
    if (totalEvents === 0) {
      return {
        totalEvents: 0,
        uniqueDays: 0,
        avgSeverity: 0,
        avgGapMinutes: null as number | null,
        mostCommonType: "none",
        peakTimeBucket: "none",
        highSeverityCount: 0,
      }
    }

    const uniqueDays = new Set(patientEvents.map((ev) => ev.localDate)).size
    const avgSeverity = patientEvents.reduce((sum, ev) => sum + ev.severity, 0) / totalEvents

    const gaps = patientEvents
      .map((ev) => ev.minutesSincePreviousEvent)
      .filter((value): value is number => typeof value === "number")
    const avgGapMinutes = gaps.length ? gaps.reduce((sum, value) => sum + value, 0) / gaps.length : null

    const typeCounts = new Map<string, number>()
    const bucketCounts = new Map<string, number>()
    let highSeverityCount = 0

    patientEvents.forEach((ev) => {
      typeCounts.set(ev.eventType, (typeCounts.get(ev.eventType) ?? 0) + 1)
      bucketCounts.set(ev.timeBucket, (bucketCounts.get(ev.timeBucket) ?? 0) + 1)
      if (ev.severity >= 8) highSeverityCount += 1
    })

    const mostCommonType = [...typeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none"
    const peakTimeBucket = [...bucketCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none"

    return {
      totalEvents,
      uniqueDays,
      avgSeverity,
      avgGapMinutes,
      mostCommonType,
      peakTimeBucket,
      highSeverityCount,
    }
  }, [patientEvents])

  const frequencyByDate = useMemo(() => {
    const counts = new Map<string, number>()
    patientEvents.forEach((ev) => {
      counts.set(ev.localDate, (counts.get(ev.localDate) ?? 0) + 1)
    })

    return [...counts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }))
  }, [patientEvents])

  const eventsByDayHour = useMemo(() => {
    const matrix = dayOrder.map((day) => ({
      day,
      hours: Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 })),
    }))
    const dayIndex = new Map(dayOrder.map((day, index) => [day, index]))

    patientEvents.forEach((ev) => {
      const rowIndex = dayIndex.get(ev.dayOfWeek)
      if (rowIndex === undefined) return
      const hour = Math.max(0, Math.min(23, ev.localHour))
      matrix[rowIndex].hours[hour].count += 1
    })

    return matrix
  }, [patientEvents])

  const intervalSeries = useMemo(() => {
    return [...patientEvents]
      .sort((a, b) => a.occurredAtUtc.localeCompare(b.occurredAtUtc))
      .filter((ev): ev is PatientEvent & { minutesSincePreviousEvent: number } => typeof ev.minutesSincePreviousEvent === "number")
      .map((ev, index) => ({
        index: index + 1,
        eventId: ev.eventId,
        minutes: ev.minutesSincePreviousEvent,
        occurredAtUtc: ev.occurredAtUtc,
      }))
  }, [patientEvents])

  const formattedAnalysisMarkdown = useMemo(() => {
    const reviewDateUtc = new Date().toISOString().replace("T", " ").replace("Z", " UTC")
    const summaryTable = [
      "| Metric | Value |",
      "| --- | --- |",
      `| Total Events | ${trendSummary.totalEvents} |`,
      `| Days With Events | ${trendSummary.uniqueDays} |`,
      `| Average Severity | ${trendSummary.avgSeverity.toFixed(1)} |`,
      `| Average Gap | ${trendSummary.avgGapMinutes ? `${Math.round(trendSummary.avgGapMinutes)} min` : "n/a"} |`,
      `| Most Frequent Type | ${formatEventTypeLabel(trendSummary.mostCommonType)} |`,
      `| Peak Time Bucket | ${formatEventTypeLabel(trendSummary.peakTimeBucket)} |`,
    ].join("\n")

    return [
      "# Cardiac Remote Monitoring Trend Report",
      "",
      "## Patient Details",
      `- **Patient Name:** ${patient.name}`,
      `- **Patient ID:** ${patient.id}`,
      `- **Age:** ${patient.age}`,
      `- **Device Model:** ${patient.deviceModel}`,
      `- **Device ID:** ${patientEventRecord?.deviceId ?? patient.deviceId}`,
      `- **Implant Date:** ${patient.implantDate}`,
      `- **Alert Level:** ${patient.alertLevel} (${alertLabel(patient.alertLevel)})`,
      "",
      "## Clinical Context",
      `- **Primary Alert:** ${patient.alertTitle}`,
      `- **Review Timestamp:** ${reviewDateUtc}`,
      `- **Data Source:** Device telemetry and patient trend logs`,
      "",
      "## Trend Summary",
      summaryTable,
      "",
      "## MedtronicGPT Interpretation",
      analysisText.trim() || "No analysis output available.",
    ].join("\n")
  }, [
    patient.name,
    patient.id,
    patient.age,
    patient.deviceModel,
    patient.deviceId,
    patient.implantDate,
    patient.alertLevel,
    patient.alertTitle,
    patientEventRecord?.deviceId,
    trendSummary.totalEvents,
    trendSummary.uniqueDays,
    trendSummary.avgSeverity,
    trendSummary.avgGapMinutes,
    trendSummary.mostCommonType,
    trendSummary.peakTimeBucket,
    analysisText,
  ])

  useEffect(() => {
    setActiveTab("events")
  }, [patient.id])

  useEffect(() => {
    if (!analysisBusy) {
      return
    }

    setShowLoadingModal(true)
    setAnalysisProgress(12)

    const timer = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 92) return prev
        return prev + Math.max(1, Math.round((96 - prev) / 7))
      })
    }, 180)

    return () => clearInterval(timer)
  }, [analysisBusy])

  function toggleEventConfirmation() {
    setConfirmedByPatientId((prev) => ({ ...prev, [patient.id]: !prev[patient.id] }))
    setDeclinedByPatientId((prev) => ({ ...prev, [patient.id]: false }))
  }

  function toggleEventDecline() {
    setDeclinedByPatientId((prev) => ({ ...prev, [patient.id]: !prev[patient.id] }))
    setConfirmedByPatientId((prev) => ({ ...prev, [patient.id]: false }))
  }

  async function runMedtronicTrendAnalysis() {
    const token = import.meta.env.VITE_MEDTRONIC_GPT_TOKEN
    if (!token) {
      setAnalysisError("Missing VITE_MEDTRONIC_GPT_TOKEN in .env")
      return
    }

    setAnalysisError(null)
    setShowAnalysisModal(false)
    setAnalysisBusy(true)

    const configuredBaseUrl = import.meta.env.VITE_MEDTRONIC_GPT_RESPONSES_URL?.trim()
    const baseUrl = configuredBaseUrl && configuredBaseUrl.includes("api.gpt.medtronic.com")
      ? "/api/medtronic/responses"
      : configuredBaseUrl || "/api/medtronic/responses"

    if (configuredBaseUrl && configuredBaseUrl.includes("api.gpt.medtronic.com")) {
      console.warn("[PatientDetail] Direct Medtronic URL detected in VITE_MEDTRONIC_GPT_RESPONSES_URL. Using /api/medtronic/responses proxy to avoid browser CORS.")
    }

    const config: MedtronicGptConfig = {
      model: import.meta.env.VITE_MEDTRONIC_GPT_MODEL || "gpt-5.4",
      token,
      baseUrl,
    }

    const payload = {
      patient: {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        deviceId: patientEventRecord?.deviceId ?? patient.deviceId,
        deviceModel: patient.deviceModel,
        alertLevel: patient.alertLevel,
        alertTitle: patient.alertTitle,
        alertDescription: patient.alertDescription,
        implantDate: patient.implantDate,
      },
      summary: {
        totalEvents: trendSummary.totalEvents,
        uniqueDays: trendSummary.uniqueDays,
        avgSeverity: Number(trendSummary.avgSeverity.toFixed(2)),
        avgGapMinutes: trendSummary.avgGapMinutes,
        mostCommonType: trendSummary.mostCommonType,
        peakTimeBucket: trendSummary.peakTimeBucket,
      },
      vitalsSnapshot: patient.readings,
      eventLogs: patientEvents,
    }

    const prompt = [
      "Analyze this cardiac patient event history and provide trend insights.",
      "Return sections: 1) Key Trends 2) Repeating Time Patterns 3) Frequency/Interval Findings 4) Clinical Risk Signals 5) Recommended Next Monitoring Actions.",
      "Keep it concise and clinically focused.",
      "Patient data:",
      JSON.stringify(payload),
    ].join("\n\n")

    try {
      let conversation = conversationsRef.current[patient.id]
      if (!conversation) {
        conversation = new MedtronicGptConversation(config)
        conversationsRef.current[patient.id] = conversation
      }

      const result = await conversation.send(prompt, {
        instructions: import.meta.env.VITE_MEDTRONIC_GPT_INSTRUCTIONS,
      })

      setAnalysisProgress(100)
      setAnalysisByPatientId((prev) => ({
        ...prev,
        [patient.id]: result.reply || "No analysis text was returned.",
      }))
      setTimeout(() => {
        setShowLoadingModal(false)
        setShowAnalysisModal(true)
      }, 220)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to call MedtronicGPT"
      console.error("[PatientDetail] MedtronicGPT trend analysis failed", {
        patientId: patient.id,
        patientName: patient.name,
        eventCount: patientEvents.length,
        error: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : String(err),
      })
      setShowLoadingModal(false)
      setAnalysisError(message)
    } finally {
      setAnalysisBusy(false)
    }
  }

  async function downloadAnalysisPdf() {
    const element = analysisContentRef.current
    if (!element || !analysisText.trim()) {
      return
    }

    setDownloadingPdf(true)

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const marginX = 10
      const marginTop = 10
      const imgWidth = pageWidth - marginX * 2
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = marginTop

      pdf.addImage(imgData, "PNG", marginX, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + marginTop
        pdf.addPage()
        pdf.addImage(imgData, "PNG", marginX, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const safeName = patient.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      pdf.save(`${safeName || patient.id}-trend-analysis.pdf`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error("[PatientDetail] PDF export failed", {
        patientId: patient.id,
        error: message,
      })
      setAnalysisError(`Failed to generate PDF: ${message}`)
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <div
      style={{
        padding: "24px 20px",
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        background: "rgba(255,255,255,0.4)",
        animation: "panel-rise 360ms ease-out",
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--text-strong)",
                margin: 0,
                marginBottom: 4,
              }}
            >
              {patient.name}
            </h2>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--text-subtle)",
              }}
            >
              Age {patient.age} · Implanted {patient.implantDate}
            </div>
          </div>

          {/* Level badge */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: color,
                color: "#f7fffc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontSize: 20,
                fontWeight: 700,
                boxShadow: isCritical ? `0 0 20px ${color}` : "none",
              }}
            >
              {patient.alertLevel}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                fontWeight: 700,
                color: color,
                letterSpacing: "0.08em",
              }}
            >
              {alertLabel(patient.alertLevel)}
            </div>
          </div>
        </div>

        {/* Alert banner */}
        <div
          style={{
            background: `rgba(${isCritical ? "209,73,47" : patient.alertLevel >= 7 ? "255,184,28" : patient.alertLevel >= 5 ? "0,94,184" : "0,169,224"},0.13)`,
            borderRadius: 10,
            padding: "12px 14px",
            borderLeft: `3px solid ${color}`,
            border: "1px solid rgba(0, 79, 154, 0.18)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 13,
              fontWeight: 600,
              color: color,
              marginBottom: 4,
            }}
          >
            {patient.alertTitle}
          </div>
          <div
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: 12,
              color: "var(--text-mid)",
              lineHeight: 1.55,
            }}
          >
            {patient.alertDescription}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          border: "1px solid rgba(20, 15, 75, 0.14)",
          borderRadius: 10,
          background: "rgba(255,255,255,0.9)",
          padding: 6,
        }}
      >
        {([
          { key: "events", label: "Events" },
          { key: "profile", label: "Profile" },
          { key: "vitals", label: "Vitals" },
          { key: "trends", label: "Trends" },
          { key: "notes", label: "Notes" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              border: "1px solid rgba(20, 15, 75, 0.16)",
              borderRadius: 8,
              background: activeTab === tab.key ? "rgba(16,16,235,0.12)" : "#fff",
              color: activeTab === tab.key ? "var(--primary-base)" : "var(--text-mid)",
              fontFamily: "var(--font-ui)",
              fontSize: 11,
              fontWeight: activeTab === tab.key ? 600 : 500,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "events" && (
        <>
          {isAbnormalRhythm ? (
            <SectionCard title="ECG Event Snapshot" actions={<CardActions labels={[isConfirmed ? "Confirmed" : "Needs Review"]} />}>
              <AiEcgViewer key={patient.id} patient={patient} />

              <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                <Row label="Detected Event" value={patient.alertTitle} />
                <Row label="Snapshot Time" value={eventTimeLabel} />
                <Row label="Status" value={isConfirmed ? "Doctor Confirmed" : isDeclined ? "Doctor Declined" : "Awaiting Doctor Confirmation"} />
              </div>

              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={toggleEventConfirmation}
                  style={{
                    border: "1px solid rgba(20, 15, 75, 0.2)",
                    borderRadius: 8,
                    background: isConfirmed ? "rgba(0, 139, 93, 0.14)" : "#fff",
                    color: isConfirmed ? "var(--ok)" : "var(--text-mid)",
                    fontFamily: "var(--font-ui)",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "6px 10px",
                    cursor: "pointer",
                  }}
                >
                  {isConfirmed ? "Unconfirm" : "Confirm Event"}
                </button>
                <button
                  onClick={toggleEventDecline}
                  style={{
                    border: "1px solid rgba(20, 15, 75, 0.2)",
                    borderRadius: 8,
                    background: isDeclined ? "rgba(205, 0, 37, 0.10)" : "#fff",
                    color: isDeclined ? "var(--danger)" : "var(--text-mid)",
                    fontFamily: "var(--font-ui)",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "6px 10px",
                    cursor: "pointer",
                  }}
                >
                  {isDeclined ? "Undecline" : "Decline Event"}
                </button>
                <span
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: 12,
                    color: isConfirmed ? "var(--ok)" : isDeclined ? "var(--danger)" : "var(--warning)",
                  }}
                >
                  {isConfirmed ? "Event review complete" : isDeclined ? "Event declined by doctor" : "Doctor action requested"}
                </span>
              </div>
            </SectionCard>
          ) : (
            <SectionCard title="Events" actions={<CardActions labels={["No Active Events"]} />}>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--text-mid)" }}>
                No abnormal rhythm events are currently detected for this patient.
              </div>
            </SectionCard>
          )}
        </>
      )}

      {activeTab === "profile" && (
        <>
          <SectionCard title="Header Details" actions={<CardActions labels={["Edit"]} />}>
            <Row label="Type" value={alertLabel(patient.alertLevel)} />
            <Row label="Expiration (UTC)" value="2026-12-31 23:59 UTC" mono />
            <Row label="Model" value={patient.deviceModel} />
            <Row label="Device ID" value={patient.deviceId} mono />
            <Row label="Implant Date" value={patient.implantDate} mono />
          </SectionCard>

          <SectionCard title="Application IDs" actions={<CardActions labels={["Edit", "Add"]} />}>
            <Row label="Primary App" value="Clinic Remote Monitor" />
            <Row label="App ID" value={`${patient.deviceId}-APP`} mono />
            <Row label="Integration" value="Rhythm Legacy Connector" />
          </SectionCard>

          <SectionCard title="Users" actions={<CardActions labels={["Edit", "Add"]} />}>
            <Row label="Attending" value="Dr Doof" />
            <Row label="Role" value="Cardiology" />
          </SectionCard>
        </>
      )}

      {activeTab === "vitals" && (
        <>
          <SectionCard title="Content" actions={<CardActions labels={["Add"]} />}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 8,
              }}
            >
              {patient.readings.map((r) => (
                <div
                  key={r.label}
                  style={{
                    background: "rgba(255,255,255,0.74)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    border: "1px solid rgba(0, 79, 154, 0.14)",
                    boxShadow: "0 6px 14px rgba(0, 57, 107, 0.06)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "var(--text-subtle)",
                      marginBottom: 4,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {r.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 20,
                      fontWeight: 700,
                      color: "var(--text-strong)",
                      lineHeight: 1,
                    }}
                  >
                    {r.value}
                    {r.unit && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 400,
                          color: "var(--text-subtle)",
                          marginLeft: 4,
                        }}
                      >
                        {r.unit}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Vitals & Monitoring" actions={<CardActions labels={["Last 14 days"]} />}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 8,
              }}
            >
              {getVitals(patient.id).map((v) => (
                <VitalCard key={v.kind} series={v} />
              ))}
            </div>
          </SectionCard>
        </>
      )}

      {activeTab === "notes" && (
        <SectionCard title="Clinical Notes" actions={<CardActions labels={["Save"]} />}>
          <textarea
            value={patient.clinicalNotes}
            onChange={(e) => onClinicalNotesChange(e.target.value)}
            aria-label="Clinical notes"
            style={{
              background: "var(--surface-card)",
              borderRadius: 10,
              padding: "12px 14px",
              fontFamily: "var(--font-ui)",
              fontSize: 13,
              color: "var(--text-mid)",
              lineHeight: 1.65,
              border: "1px solid rgba(20, 15, 75, 0.14)",
              width: "100%",
              minHeight: 130,
              resize: "vertical",
              outline: "none",
            }}
          />
        </SectionCard>
      )}

      {activeTab === "trends" && (
        <>
          <SectionCard title="MedtronicGPT Trend Analysis" actions={<CardActions labels={[analysisBusy ? "Analyzing" : "Ready"]} />}>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--text-mid)", lineHeight: 1.5 }}>
                Send this patient's event logs and vitals snapshot to MedtronicGPT for trend interpretation.
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={runMedtronicTrendAnalysis}
                  disabled={analysisBusy}
                  style={{
                    border: "1px solid rgba(20, 15, 75, 0.2)",
                    borderRadius: 8,
                    background: analysisBusy ? "rgba(16,16,235,0.08)" : "var(--primary-base)",
                    color: analysisBusy ? "var(--text-subtle)" : "#fff",
                    fontFamily: "var(--font-ui)",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "7px 12px",
                    cursor: analysisBusy ? "not-allowed" : "pointer",
                  }}
                >
                  {analysisBusy ? "Analyzing..." : "Analyze Trends"}
                </button>
                {analysisText && (
                  <button
                    onClick={() => setShowAnalysisModal(true)}
                    style={{
                      border: "1px solid rgba(20, 15, 75, 0.2)",
                      borderRadius: 8,
                      background: "#fff",
                      color: "var(--text-mid)",
                      fontFamily: "var(--font-ui)",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "7px 12px",
                      cursor: "pointer",
                    }}
                  >
                    View Last Analysis
                  </button>
                )}
              </div>
              {analysisError && (
                <div style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--danger)" }}>
                  {analysisError}
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Trend Data Snapshot" actions={<CardActions labels={[`${trendSummary.totalEvents} Events`]} />}>
            <div style={{ display: "grid", gap: 6 }}>
              <Row label="Patient ID" value={patient.id} mono />
              <Row label="Device ID" value={patientEventRecord?.deviceId ?? patient.deviceId} mono />
              <Row label="Total Events" value={String(trendSummary.totalEvents)} />
              <Row label="Days With Events" value={String(trendSummary.uniqueDays)} />
              <Row label="Avg Severity" value={trendSummary.avgSeverity.toFixed(1)} />
              <Row label="Avg Gap" value={trendSummary.avgGapMinutes ? `${Math.round(trendSummary.avgGapMinutes)} min` : "n/a"} />
              <Row label="Most Frequent Type" value={formatEventTypeLabel(trendSummary.mostCommonType)} />
              <Row label="Peak Time Bucket" value={formatEventTypeLabel(trendSummary.peakTimeBucket)} />
              <Row label="High Severity (>=8)" value={String(trendSummary.highSeverityCount)} />
            </div>
          </SectionCard>

          <SectionCard title="Event Frequency Over Time" actions={<CardActions labels={["Daily Counts"]} />}>
            <FrequencyBars data={frequencyByDate} />
          </SectionCard>

          <SectionCard title="Time-of-Day Distribution" actions={<CardActions labels={["Hour x Day"]} />}>
            <DayHourHeatmap data={eventsByDayHour} />
          </SectionCard>

          <SectionCard title="Inter-Event Interval Trend" actions={<CardActions labels={["Minutes Since Previous"]} />}>
            <IntervalTrendChart data={intervalSeries} />
          </SectionCard>
        </>
      )}

      {showLoadingModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 14, 28, 0.46)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: 16,
          }}
        >
          <div
            style={{
              width: "min(520px, 94vw)",
              borderRadius: 12,
              border: "1px solid rgba(20, 15, 75, 0.18)",
              background: "#ffffff",
              boxShadow: "0 20px 50px rgba(18, 22, 50, 0.28)",
              padding: "16px 16px 18px",
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--text-strong)", fontWeight: 700 }}>
              Analyzing Patient Trends
            </div>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--text-mid)", lineHeight: 1.5 }}>
              MedtronicGPT is reviewing event timelines, recurring windows, and interval patterns.
            </div>
            <div style={{ height: 10, borderRadius: 999, background: "rgba(20, 15, 75, 0.09)", overflow: "hidden" }}>
              <div
                style={{
                  width: `${analysisProgress}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: "linear-gradient(90deg, var(--primary-base), var(--ok))",
                  transition: "width 160ms ease-out",
                }}
              />
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-subtle)", textAlign: "right" }}>
              {Math.min(100, Math.round(analysisProgress))}%
            </div>
          </div>
        </div>
      )}

      {showAnalysisModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(8, 12, 26, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2010,
            padding: 14,
          }}
        >
          <div
            style={{
              width: "min(980px, 96vw)",
              height: "min(82vh, 760px)",
              borderRadius: 12,
              border: "1px solid rgba(20, 15, 75, 0.18)",
              background: "#ffffff",
              boxShadow: "0 24px 60px rgba(18, 22, 50, 0.34)",
              display: "grid",
              gridTemplateRows: "auto 1fr auto",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(20, 15, 75, 0.12)", background: "#ffffff" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--text-strong)" }}>
                Trend Analysis Report
              </div>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--text-subtle)", marginTop: 3 }}>
                {patient.name} · {patient.id}
              </div>
            </div>

            <div style={{ overflowY: "auto", padding: "20px 24px", background: "#ffffff" }}>
              <div
                ref={analysisContentRef}
                className="trend-markdown"
                style={{
                  maxWidth: 860,
                  margin: "0 auto",
                  padding: "28px 34px",
                  background: "#ffffff",
                  border: "1px solid rgba(20, 15, 75, 0.12)",
                  borderRadius: 10,
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{formattedAnalysisMarkdown}</ReactMarkdown>
              </div>
            </div>

            <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(20, 15, 75, 0.12)", background: "#ffffff", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={downloadAnalysisPdf}
                disabled={downloadingPdf || !analysisText.trim()}
                style={{
                  border: "1px solid rgba(20, 15, 75, 0.2)",
                  borderRadius: 8,
                  background: downloadingPdf ? "rgba(16,16,235,0.08)" : "var(--primary-base)",
                  color: downloadingPdf ? "var(--text-subtle)" : "#fff",
                  fontFamily: "var(--font-ui)",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "7px 12px",
                  cursor: downloadingPdf || !analysisText.trim() ? "not-allowed" : "pointer",
                }}
              >
                {downloadingPdf ? "Generating PDF..." : "Download PDF"}
              </button>
              <button
                onClick={() => setShowAnalysisModal(false)}
                style={{
                  border: "1px solid rgba(20, 15, 75, 0.2)",
                  borderRadius: 8,
                  background: "#fff",
                  color: "var(--text-mid)",
                  fontFamily: "var(--font-ui)",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "7px 12px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatEventTypeLabel(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ")
}

function FrequencyBars({ data }: { data: Array<{ date: string; count: number }> }) {
  if (data.length === 0) {
    return <EmptyTrendState message="No event history available for frequency chart." />
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {data.map((item) => {
        const widthPct = Math.max((item.count / maxCount) * 100, 6)

        return (
          <div key={item.date} style={{ display: "grid", gridTemplateColumns: "95px 1fr 26px", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-subtle)" }}>{item.date}</span>
            <div style={{ height: 10, borderRadius: 999, background: "rgba(20, 15, 75, 0.08)", overflow: "hidden" }}>
              <div style={{ width: `${widthPct}%`, height: "100%", borderRadius: 999, background: "var(--primary-base)" }} />
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-mid)", textAlign: "right" }}>{item.count}</span>
          </div>
        )
      })}
    </div>
  )
}

function DayHourHeatmap({
  data,
}: {
  data: Array<{ day: string; hours: Array<{ hour: number; count: number }> }>
}) {
  const maxCount = Math.max(...data.flatMap((row) => row.hours.map((h) => h.count)), 0)
  const hasData = maxCount > 0

  if (!hasData) {
    return <EmptyTrendState message="No event history available for time-of-day distribution." />
  }

  return (
    <div style={{ overflowX: "auto", paddingBottom: 4 }}>
      <div style={{ minWidth: 700, display: "grid", gap: 5 }}>
        <div style={{ display: "grid", gridTemplateColumns: "72px repeat(24, 1fr)", gap: 3 }}>
          <div />
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={`h-${hour}`} style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-subtle)", textAlign: "center" }}>
              {hour}
            </div>
          ))}
        </div>
        {data.map((row) => (
          <div key={row.day} style={{ display: "grid", gridTemplateColumns: "72px repeat(24, 1fr)", gap: 3, alignItems: "center" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-subtle)" }}>{row.day.slice(0, 3)}</div>
            {row.hours.map((cell) => {
              const alpha = cell.count === 0 ? 0.08 : 0.22 + (cell.count / maxCount) * 0.6
              return (
                <div
                  key={`${row.day}-${cell.hour}`}
                  title={`${row.day} ${cell.hour.toString().padStart(2, "0")}:00 - ${cell.count} events`}
                  style={{
                    height: 14,
                    borderRadius: 3,
                    border: "1px solid rgba(20, 15, 75, 0.08)",
                    background: `rgba(16,16,235,${alpha})`,
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function IntervalTrendChart({
  data,
}: {
  data: Array<{ index: number; eventId: string; minutes: number; occurredAtUtc: string }>
}) {
  if (data.length === 0) {
    return <EmptyTrendState message="No interval data yet (need at least 2 sequential events)." />
  }

  const w = 460
  const h = 140
  const padL = 24
  const padR = 10
  const padT = 12
  const padB = 20
  const minY = Math.min(...data.map((d) => d.minutes))
  const maxY = Math.max(...data.map((d) => d.minutes))
  const yRange = Math.max(maxY - minY, 1)
  const xStep = data.length > 1 ? (w - padL - padR) / (data.length - 1) : 0

  const points = data
    .map((d, i) => {
      const x = padL + i * xStep
      const y = padT + (1 - (d.minutes - minY) / yRange) * (h - padT - padB)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: 160, background: "rgba(255,255,255,0.72)", borderRadius: 8, border: "1px solid rgba(20, 15, 75, 0.1)" }}>
        <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="rgba(20,15,75,0.25)" strokeWidth={1} />
        <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="rgba(20,15,75,0.25)" strokeWidth={1} />
        <polyline points={points} fill="none" stroke="var(--warning)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = padL + i * xStep
          const y = padT + (1 - (d.minutes - minY) / yRange) * (h - padT - padB)
          return <circle key={d.eventId} cx={x} cy={y} r={3} fill="var(--warning)" />
        })}
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 6 }}>
        {data.map((item) => (
          <div key={`${item.eventId}-meta`} style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-subtle)", border: "1px solid rgba(20, 15, 75, 0.1)", borderRadius: 6, padding: "6px 8px", background: "rgba(255,255,255,0.66)" }}>
            #{item.index} · {item.minutes} min · {item.occurredAtUtc.replace("T", " ").replace("Z", " UTC")}
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyTrendState({ message }: { message: string }) {
  return <div style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--text-subtle)" }}>{message}</div>
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        fontWeight: 700,
        color: "var(--text-subtle)",
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  )
}

function SectionCard({
  title,
  actions,
  children,
}: {
  title: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section
      style={{
        background: "var(--surface-card)",
        borderRadius: 10,
        border: "1px solid rgba(20, 15, 75, 0.14)",
        boxShadow: "0 8px 18px rgba(20, 15, 75, 0.08)",
        overflow: "hidden",
      }}
    >
      <div style={{ height: 3, background: "var(--primary-base)" }} />
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
          <SectionLabel>{title}</SectionLabel>
          {actions}
        </div>
        {children}
      </div>
    </section>
  )
}

function CardActions({ labels }: { labels: string[] }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {labels.map((label) => (
        <button
          key={label}
          style={{
            border: "1px solid rgba(20, 15, 75, 0.18)",
            borderRadius: 8,
            background: "#fff",
            color: "var(--text-mid)",
            fontFamily: "var(--font-ui)",
            fontSize: 11,
            padding: "4px 8px",
            cursor: "pointer",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--text-subtle)",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: mono ? "var(--font-mono)" : "var(--font-ui)",
          fontSize: mono ? 12 : 13,
          color: "var(--text-mid)",
          textAlign: "right",
          wordBreak: "break-all",
        }}
      >
        {value}
      </span>
    </div>
  )
}

function vitalStatusColor(status: VitalStatus): string {
  if (status === "alert") return "var(--danger)"
  if (status === "watch") return "var(--warning)"
  return "var(--ok)"
}

function vitalStatusLabel(status: VitalStatus): string {
  if (status === "alert") return "ALERT"
  if (status === "watch") return "WATCH"
  return "NORMAL"
}

function trendArrow(t: TrendDirection): string {
  if (t === "up") return "\u2191"
  if (t === "down") return "\u2193"
  return "\u2192"
}

function changeText(v: VitalSeries): string {
  if (Math.abs(v.change) < 0.05) return "stable"
  const sign = v.change > 0 ? "+" : "-"
  const mag = Math.abs(v.change)
  const val = v.kind === "weight" ? mag.toFixed(1) : String(Math.round(mag))
  return `${sign}${val} ${v.unit}`
}

function trendColor(v: VitalSeries): string {
  if (v.trend === "flat") return "var(--text-subtle)"
  const rising = v.trend === "up"
  const bad = higherIsWorse(v.kind) ? rising : !rising
  return bad ? "var(--danger)" : "var(--ok)"
}

function Sparkline({ series }: { series: VitalSeries }) {
  const pts = series.readings
  if (pts.length < 2) return null

  const w = 200
  const h = 34
  const pad = 3
  const values = pts.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min < 1e-6 ? 1 : max - min
  const stepX = (w - pad * 2) / (pts.length - 1)

  const points = pts
    .map((p, i) => {
      const x = pad + stepX * i
      const y = h - pad - ((p.value - min) / range) * (h - pad * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: 34, marginTop: 8, display: "block" }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={vitalStatusColor(series.status)}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function VitalCard({ series }: { series: VitalSeries }) {
  const color = vitalStatusColor(series.status)

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.74)",
        borderRadius: 10,
        padding: "10px 12px",
        border: "1px solid rgba(0, 79, 154, 0.14)",
        boxShadow: "0 6px 14px rgba(0, 57, 107, 0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--text-subtle)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {series.displayName}
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            fontWeight: 700,
            color: "#f7fffc",
            background: color,
            borderRadius: 999,
            padding: "2px 6px",
            letterSpacing: "0.06em",
            flexShrink: 0,
          }}
        >
          {vitalStatusLabel(series.status)}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 20,
            fontWeight: 700,
            color: "var(--text-strong)",
            lineHeight: 1,
          }}
        >
          {series.latestDisplay}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-subtle)" }}>
          {series.unit}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 600,
            color: trendColor(series),
          }}
        >
          {trendArrow(series.trend)} {changeText(series)}
        </span>
      </div>

      <Sparkline series={series} />
    </div>
  )
}

function hasAbnormalRhythm(patient: Patient): boolean {
  const text = `${patient.alertTitle} ${patient.alertDescription}`.toLowerCase()
  return patient.alertLevel >= 7 || /(af|vf|vt|arrhythm|tachy|brady|rhythm)/.test(text)
}

function getEventTimeLabel(patient: Patient): string {
  const entry = patient.readings.find((r) => /(episode|event|af burden|vt|shock)/i.test(r.label))
  if (!entry) return "Captured in latest transmission"
  return `${entry.value}${entry.unit ? ` ${entry.unit}` : ""}`
}

interface SavedEcgEvent {
  id: string | number
  timestamp: Date
  example: (typeof ecgExamples)[number]
  confirmed: boolean
  declined: boolean
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function AiEcgViewer({ patient }: { patient: Patient }) {
  const isAfibPatient = /(af|atrial fib)/i.test(`${patient.alertTitle} ${patient.alertDescription}`)
  const afibPool = ecgExamples.filter((e) => e.gradcamClass === "AFIB")
  const nPool = ecgExamples.filter((e) => e.gradcamClass === "N")

  // Pick a deterministic live (N) example for this patient
  const liveExample = nPool[patient.id.charCodeAt(1) % nPool.length]

  // Saved AFIB events — pre-seeded for demo (single starter event for AFIB patients)
  const [savedEvents, setSavedEvents] = useState<SavedEcgEvent[]>(() => {
    if (!isAfibPatient) return []
    const seed: SavedEcgEvent[] = []
    const ex = afibPool[patient.id.charCodeAt(1) % afibPool.length]
    const t = new Date(); t.setMinutes(t.getMinutes() - 4)
    seed.push({ id: 0, timestamp: t, example: ex, confirmed: false, declined: false })
    return seed
  })
  const [liveTime, setLiveTime] = useState(new Date())
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollAnimRef = useRef<number | null>(null)

  // Live clock tick every second
  useEffect(() => {
    const id = setInterval(() => setLiveTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Subscribe to globally ingested ECG events for this patient.
  useEffect(() => {
    if (!isAfibPatient) return

    return ecgIngestionService.subscribe((event) => {
      if (event.patientId !== patient.id) return

      setSavedEvents((prev) => {
        if (prev.some((saved) => saved.id === event.id)) return prev
        return [
          {
            id: event.id,
            timestamp: event.timestamp,
            example: event.example,
            confirmed: false,
            declined: false,
          },
          ...prev,
        ]
      })
    })
  }, [isAfibPatient, patient.id])

  // Auto-scroll the live ECG strip
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let pos = 0
    function step() {
      if (!el) return
      pos += 0.6
      if (pos >= el.scrollWidth - el.clientWidth) pos = 0
      el.scrollLeft = pos
      scrollAnimRef.current = requestAnimationFrame(step)
    }
    scrollAnimRef.current = requestAnimationFrame(step)
    return () => { if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current) }
  }, [])

  function updateEvent(id: string | number, patch: Partial<Pick<SavedEcgEvent, "confirmed" | "declined">>) {
    setSavedEvents((prev) => prev.map((e) => e.id === id ? { ...e, ...patch } : e))
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Live feed ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--ok)", animation: "pulse-border 1.4s ease-in-out infinite" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--ok)", letterSpacing: "0.08em" }}>LIVE</span>
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-subtle)" }}>{formatTime(liveTime)}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-subtle)" }}>· No AFIB detected</span>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-subtle)", letterSpacing: "0.06em" }}>
            {liveExample.recordId}
          </span>
        </div>
        <div
          ref={scrollRef}
          style={{
            overflowX: "hidden",
            overflowY: "hidden",
            borderRadius: 8,
            border: "1px solid rgba(0, 139, 93, 0.25)",
            background: "#f7fffb",
            boxShadow: "0 0 0 1px rgba(0,139,93,0.08)",
            cursor: "default",
          }}
        >
          <img
            src={liveExample.rawImage}
            alt="Live ECG feed"
            style={{ height: 130, width: "auto", maxWidth: "none", display: "block" }}
            draggable={false}
          />
        </div>
        <div style={{ marginTop: 5, fontFamily: "var(--font-ui)", fontSize: 10, color: "var(--text-subtle)" }}>
          Real-time feed · Device polling every 60 s · Scroll to review history
        </div>
      </div>

      {/* ── Saved AFIB events ── */}
      {savedEvents.length > 0 && (
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-subtle)", marginBottom: 8 }}>
            Saved AFIB Events ({savedEvents.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {savedEvents.map((ev) => (
              <SavedEventCard key={ev.id} event={ev} onUpdate={(patch) => updateEvent(ev.id, patch)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SavedEventCard({ event, onUpdate }: { event: SavedEcgEvent; onUpdate: (patch: Partial<Pick<SavedEcgEvent, "confirmed" | "declined">>) => void }) {
  const [view, setView] = useState<"raw" | "gradcam">("raw")

  return (
    <div
      style={{
        borderRadius: 8,
        border: "1px solid rgba(205, 0, 37, 0.22)",
        background: "rgba(255,255,255,0.85)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(205,0,37,0.06)", borderBottom: "1px solid rgba(205,0,37,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--danger)", letterSpacing: "0.08em" }}>AFIB DETECTED</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-subtle)" }}>
            Saved {event.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {(["raw", "gradcam"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} style={{ border: "1px solid rgba(20,15,75,0.18)", background: view === v ? "var(--primary-base)" : "#fff", color: view === v ? "#fff" : "var(--text-mid)", borderRadius: 5, padding: "2px 7px", fontFamily: "var(--font-ui)", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
              {v === "raw" ? "Raw" : "Grad-CAM"}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable image */}
      <div style={{ overflowX: "auto", overflowY: "hidden", background: "#fff5f5" }}>
        <img
          src={view === "raw" ? event.example.rawImage : event.example.gradcamImage}
          alt={view === "raw" ? "Saved ECG event" : "Grad-CAM analysis"}
          style={{ height: 120, width: "auto", maxWidth: "none", display: "block" }}
          draggable={false}
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderTop: "1px solid rgba(20,15,75,0.08)" }}>
        <button
          onClick={() => onUpdate({ confirmed: !event.confirmed, declined: false })}
          style={{ border: "1px solid rgba(20,15,75,0.18)", borderRadius: 6, background: event.confirmed ? "rgba(0,139,93,0.12)" : "#fff", color: event.confirmed ? "var(--ok)" : "var(--text-mid)", fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, padding: "4px 9px", cursor: "pointer" }}
        >
          {event.confirmed ? "Confirmed ✓" : "Confirm"}
        </button>
        <button
          onClick={() => onUpdate({ declined: !event.declined, confirmed: false })}
          style={{ border: "1px solid rgba(20,15,75,0.18)", borderRadius: 6, background: event.declined ? "rgba(205,0,37,0.10)" : "#fff", color: event.declined ? "var(--danger)" : "var(--text-mid)", fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, padding: "4px 9px", cursor: "pointer" }}
        >
          {event.declined ? "Declined ✗" : "Decline"}
        </button>
        <span style={{ fontFamily: "var(--font-ui)", fontSize: 11, color: event.confirmed ? "var(--ok)" : event.declined ? "var(--danger)" : "var(--warning)", marginLeft: 4 }}>
          {event.confirmed ? "Review complete" : event.declined ? "Event declined" : "Awaiting review"}
        </span>
      </div>
    </div>
  )
}

