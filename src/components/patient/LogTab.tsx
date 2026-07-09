import { useState } from "react"
import SideSheet from "./SideSheet"
import TableToolbar from "./TableToolbar"
import RadialList from "./RadialList"

type Section = "weight" | "symptoms" | "activity"
type ViewMode = "list" | "form"

const SYMPTOMS_LIST = [
  "Shortness of breath",
  "Chest pain / pressure",
  "Dizziness / lightheadedness",
  "Palpitations / racing heart",
  "Swollen ankles / legs",
  "Fatigue / weakness",
  "Nausea",
  "Headache",
]

const ACTIVITY_LIST = [
  "Brisk walk",
  "Jogging / running",
  "Cycling",
  "Swimming",
  "Strength training",
  "Yard work / gardening",
  "Climbing stairs",
  "Other strenuous activity",
]

const INTENSITY = ["Light", "Moderate", "Vigorous"]
const PROVIDERS = ["Garmin", "Apple Watch", "Fitbit", "Oura"]

function SectionTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "8px 0",
        background: active ? "var(--blue)" : "transparent",
        border: "1px solid",
        borderColor: active ? "var(--blue)" : "var(--border-strong)",
        borderRadius: 8,
        fontFamily: "var(--sans)",
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        color: active ? "#fff" : "var(--text-muted)",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  )
}

function WeightSection({ onSave }: { onSave: () => void }) {
  const [weight, setWeight] = useState("")
  const [unit, setUnit] = useState<"lbs" | "kg">("lbs")

  function handleSave() {
    if (!weight) return
    setWeight("")
    onSave()
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 13, color: "var(--text-sub)", lineHeight: 1.5 }}>
        Weigh yourself at the same time each day, preferably in the morning before eating.
        Rapid weight gain (2+ lbs in a day) can indicate fluid retention — your care team will be notified.
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
            Weight
          </label>
          <input
            type="number"
            placeholder="0.0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            style={{
              width: "100%",
              background: "var(--surface-2)",
              border: "1px solid var(--border-strong)",
              borderRadius: 10,
              padding: "12px 14px",
              fontFamily: "var(--mono)",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text)",
              outline: "none",
            }}
          />
        </div>
        <div>
          <label style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
            Unit
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {(["lbs", "kg"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                style={{
                  padding: "10px 16px",
                  background: unit === u ? "var(--blue)" : "var(--surface-2)",
                  border: "1px solid",
                  borderColor: unit === u ? "var(--blue)" : "var(--border-strong)",
                  borderRadius: 8,
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: unit === u ? "#fff" : "var(--text-muted)",
                  transition: "all 0.15s",
                }}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
          Time of Reading
        </div>
        <input
          type="time"
          defaultValue="07:30"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border-strong)",
            borderRadius: 10,
            padding: "10px 14px",
            fontFamily: "var(--mono)",
            fontSize: 14,
            color: "var(--text)",
            outline: "none",
            width: "100%",
            colorScheme: "dark",
          }}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={!weight}
        style={{
          padding: "14px",
          background: weight ? "var(--blue)" : "var(--surface-2)",
          border: "none",
          borderRadius: 12,
          fontFamily: "var(--sans)",
          fontSize: 14,
          fontWeight: 600,
          color: weight ? "#fff" : "var(--text-muted)",
          transition: "all 0.15s",
        }}
      >
        Log Weight
      </button>
    </div>
  )
}

function SymptomsSection({ onSave }: { onSave: () => void }) {
  const [selected, setSelected] = useState<string[]>([])
  const [severity, setSeverity] = useState(3)
  const [notes, setNotes] = useState("")

  function toggle(s: string) {
    setSelected((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  function handleSave() {
    setSelected([])
    setNotes("")
    onSave()
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 13, color: "var(--text-sub)", lineHeight: 1.5 }}>
        Select any symptoms you're experiencing today. This helps your doctor track patterns and respond quickly to changes.
      </div>

      <div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
          Select Symptoms
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SYMPTOMS_LIST.map((s) => {
            const active = selected.includes(s)
            return (
              <button
                key={s}
                onClick={() => toggle(s)}
                style={{
                  padding: "7px 12px",
                  background: active ? "rgba(239,68,68,0.15)" : "var(--surface-2)",
                  border: "1px solid",
                  borderColor: active ? "rgba(239,68,68,0.5)" : "var(--border-strong)",
                  borderRadius: 20,
                  fontFamily: "var(--sans)",
                  fontSize: 12,
                  color: active ? "#f87171" : "var(--text-sub)",
                  transition: "all 0.15s",
                }}
              >
                {s}
              </button>
            )
          })}
        </div>
      </div>

      {selected.length > 0 && (
        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
            Severity (1 = mild, 10 = severe)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="range"
              min={1}
              max={10}
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              style={{ flex: 1, accentColor: severity >= 7 ? "var(--red)" : severity >= 4 ? "var(--amber)" : "var(--green)" }}
            />
            <span style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 700, color: severity >= 7 ? "var(--red)" : severity >= 4 ? "var(--amber)" : "var(--green)", minWidth: 24, textAlign: "right" }}>
              {severity}
            </span>
          </div>
        </div>
      )}

      <div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
          Additional Notes
        </div>
        <textarea
          placeholder="Describe how you're feeling in more detail..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            background: "var(--surface-2)",
            border: "1px solid var(--border-strong)",
            borderRadius: 10,
            padding: "12px 14px",
            fontFamily: "var(--sans)",
            fontSize: 13,
            color: "var(--text)",
            outline: "none",
            resize: "none",
            lineHeight: 1.5,
          }}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={selected.length === 0 && !notes}
        style={{
          padding: "14px",
          background: (selected.length > 0 || notes) ? "var(--blue)" : "var(--surface-2)",
          border: "none",
          borderRadius: 12,
          fontFamily: "var(--sans)",
          fontSize: 14,
          fontWeight: 600,
          color: (selected.length > 0 || notes) ? "#fff" : "var(--text-muted)",
          transition: "all 0.15s",
        }}
      >
        Log Symptoms {selected.length > 0 && `(${selected.length})`}
      </button>
    </div>
  )
}

function ActivitySection({ onSave }: { onSave: () => void }) {
  const [activity, setActivity] = useState("")
  const [intensity, setIntensity] = useState("")
  const [duration, setDuration] = useState("")
  const [notes, setNotes] = useState("")

  function handleSave() {
    if (!activity || !intensity) return
    setActivity("")
    setIntensity("")
    setDuration("")
    setNotes("")
    onSave()
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 13, color: "var(--text-sub)", lineHeight: 1.5 }}>
        Log strenuous activity so your care team can correlate your heart readings. Activity affects heart rate, blood pressure, and weight.
      </div>

      <div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
          Type of Activity
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ACTIVITY_LIST.map((a) => (
            <button
              key={a}
              onClick={() => setActivity(a)}
              style={{
                padding: "7px 12px",
                background: activity === a ? "rgba(26,108,240,0.18)" : "var(--surface-2)",
                border: "1px solid",
                borderColor: activity === a ? "rgba(26,108,240,0.6)" : "var(--border-strong)",
                borderRadius: 20,
                fontFamily: "var(--sans)",
                fontSize: 12,
                color: activity === a ? "var(--blue-bright)" : "var(--text-sub)",
                transition: "all 0.15s",
              }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
            Intensity
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {INTENSITY.map((i) => (
              <button
                key={i}
                onClick={() => setIntensity(i)}
                style={{
                  padding: "9px 12px",
                  background: intensity === i ? "var(--surface-2)" : "transparent",
                  border: "1px solid",
                  borderColor: intensity === i ? "var(--blue)" : "var(--border-strong)",
                  borderRadius: 8,
                  fontFamily: "var(--sans)",
                  fontSize: 12,
                  fontWeight: intensity === i ? 600 : 400,
                  color: intensity === i ? "var(--blue-bright)" : "var(--text-muted)",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
            Duration (min)
          </div>
          <input
            type="number"
            placeholder="30"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            style={{
              width: "100%",
              background: "var(--surface-2)",
              border: "1px solid var(--border-strong)",
              borderRadius: 10,
              padding: "12px 14px",
              fontFamily: "var(--mono)",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text)",
              outline: "none",
            }}
          />
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.4 }}>
            After vigorous activity, wait 30 min before weighing yourself.
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
          How Did You Feel During / After?
        </div>
        <textarea
          placeholder="Any symptoms? Chest tightness, shortness of breath, dizziness..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            background: "var(--surface-2)",
            border: "1px solid var(--border-strong)",
            borderRadius: 10,
            padding: "12px 14px",
            fontFamily: "var(--sans)",
            fontSize: 13,
            color: "var(--text)",
            outline: "none",
            resize: "none",
            lineHeight: 1.5,
          }}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={!activity || !intensity}
        style={{
          padding: "14px",
          background: (activity && intensity) ? "var(--blue)" : "var(--surface-2)",
          border: "none",
          borderRadius: 12,
          fontFamily: "var(--sans)",
          fontSize: 14,
          fontWeight: 600,
          color: (activity && intensity) ? "#fff" : "var(--text-muted)",
          transition: "all 0.15s",
        }}
      >
        Log Activity
      </button>
    </div>
  )
}

export default function LogTab() {
  const [section, setSection] = useState<Section>("weight")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [searchValue, setSearchValue] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0])

  // Mock data for logged entries
  const loggedEntries = {
    weight: [
      { id: "1", label: "Morning weight", value: "176.2 lbs", color: "var(--blue-bright)", time: "7:30 AM" },
      { id: "2", label: "Previous day", value: "175.4 lbs", color: "var(--blue-bright)", time: "Yesterday 7:45 AM" },
    ],
    symptoms: [
      { id: "1", label: "Shortness of breath", value: "Severity: 4/10", color: "var(--amber)", badge: "Monitor", badgeColor: "rgba(251,146,60,0.5)" },
      { id: "2", label: "Chest tightness", value: "Severity: 3/10", color: "var(--green)", badge: "Normal" },
    ],
    activity: [
      { id: "1", label: "Jogging / running", value: "Moderate · 20 minutes", color: "var(--green)" },
      { id: "2", label: "Brisk walk", value: "Light · 30 minutes", color: "var(--blue-bright)" },
    ],
  }

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 2 }}>
          Health Log
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Track your health data
        </div>
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 14,
        }}
      >
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 7 }}>
          Connect Provider (Mock)
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
          {PROVIDERS.map((provider) => {
            const active = provider === selectedProvider
            return (
              <button
                key={provider}
                onClick={() => setSelectedProvider(provider)}
                style={{
                  padding: "6px 11px",
                  background: active ? "rgba(16,16,235,0.12)" : "var(--surface-2)",
                  border: "1px solid",
                  borderColor: active ? "rgba(16,16,235,0.45)" : "var(--border-strong)",
                  borderRadius: 999,
                  fontFamily: "var(--sans)",
                  fontSize: 12,
                  color: active ? "var(--blue-bright)" : "var(--text-sub)",
                  cursor: "pointer",
                }}
              >
                {provider}
              </button>
            )
          })}
        </div>
        <button
          style={{
            width: "100%",
            padding: "10px 12px",
            background: "rgba(16,16,235,0.1)",
            border: "1px solid rgba(16,16,235,0.32)",
            borderRadius: 10,
            fontFamily: "var(--sans)",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--blue-bright)",
            cursor: "pointer",
          }}
        >
          Connect provider
        </button>
      </div>

      {/* View Toggle */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        <SectionTab label="Weight" active={section === "weight"} onClick={() => setSection("weight")} />
        <SectionTab label="Symptoms" active={section === "symptoms"} onClick={() => setSection("symptoms")} />
        <SectionTab label="Activity" active={section === "activity"} onClick={() => setSection("activity")} />
      </div>

      {viewMode === "list" ? (
        <>
          {/* Table Toolbar */}
          <TableToolbar
            searchPlaceholder="Search logs..."
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onFilterToggle={() => setFilterOpen(!filterOpen)}
            onAddAction={() => setViewMode("form")}
            filterActive={filterOpen}
          />

          {/* Radial List */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
            <RadialList
              items={loggedEntries[section]}
              emptyMessage="No entries logged yet"
              isEditable={false}
            />
          </div>
        </>
      ) : (
        <div>
          {section === "weight" && <WeightSection onSave={() => setViewMode("list")} />}
          {section === "symptoms" && <SymptomsSection onSave={() => setViewMode("list")} />}
          {section === "activity" && <ActivitySection onSave={() => setViewMode("list")} />}
          
          <button
            onClick={() => setViewMode("list")}
            style={{
              width: "100%",
              padding: "12px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-muted)",
              cursor: "pointer",
              marginTop: 12,
            }}
          >
            Back to List
          </button>
        </div>
      )}
    </div>
  )
}
