import { useState } from "react"
import SideSheet from "./SideSheet"

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "11px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontFamily: mono ? "var(--mono)" : "var(--sans)", fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{value}</span>
    </div>
  )
}

function Section({ title, children, onEdit }: { title: string; children: React.ReactNode; onEdit?: () => void }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "14px 16px",
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          {title}
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            style={{
              padding: "4px 8px",
              background: "rgba(79,195,247,0.08)",
              border: "1px solid rgba(79,195,247,0.3)",
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 600,
              color: "var(--blue-bright)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            Edit
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function DeviceStatus({ name, connected, lastSync }: { name: string; connected: boolean; lastSync: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: connected ? "rgba(34,197,94,0.1)" : "var(--surface-2)",
          border: "1px solid",
          borderColor: connected ? "rgba(34,197,94,0.25)" : "var(--border-strong)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={connected ? "var(--green)" : "var(--text-muted)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
          <line x1="12" y1="18" x2="12.01" y2="18"/>
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{name}</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>
          {connected ? `Checked in ${lastSync}` : "Disconnected"}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? "var(--green)" : "var(--text-muted)" }} />
        <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: connected ? "var(--green)" : "var(--text-muted)", letterSpacing: "0.06em" }}>
          {connected ? "ONLINE" : "OFFLINE"}
        </span>
      </div>
    </div>
  )
}

export default function ProfileTab() {
  const [editOpen, setEditOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<string | null>(null)

  const handleEditSection = (section: string) => {
    setEditingSection(section)
    setEditOpen(true)
  }

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      {/* Avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1a6cf0 0%, #0d47a1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: 22,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          JS
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>John Smith</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>Patient ID · CLN-2847-JS</div>
          <div style={{ fontSize: 11, color: "var(--blue-bright)", marginTop: 3 }}>Under care of Dr Doof</div>
        </div>
      </div>

      {/* Clinical info */}
      <Section title="Clinical Profile" onEdit={() => handleEditSection("clinical")}>
        <InfoRow label="Date of Birth" value="March 14, 1958" />
        <InfoRow label="Age" value="68" />
        <InfoRow label="Diagnosis" value="CHF — Stage II" />
        <InfoRow label="Blood Type" value="A+" mono />
        <div style={{ paddingTop: 11 }}>
          <InfoRow label="Primary Physician" value="Dr Doof" />
        </div>
      </Section>

      {/* Target ranges */}
      <Section title="My Target Ranges" onEdit={() => handleEditSection("targets")}>
        <InfoRow label="Heart Rate" value="60–100 bpm" mono />
        <InfoRow label="Blood Pressure" value="< 130/80 mmHg" mono />
        <InfoRow label="SpO₂" value="≥ 95%" mono />
        <InfoRow label="Daily Weight Change" value="< 2 lbs / day" mono />
        <div style={{ paddingTop: 2, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
          Ranges set by Dr Doof · Updated Jun 1, 2025
        </div>
      </Section>

      {/* Devices */}
      <Section title="Connected Devices">
        <DeviceStatus
          name="Medtronic LINQ II ICM"
          connected={true}
          lastSync="4 min ago"
        />
        <DeviceStatus
          name="Withings BPM Connect"
          connected={true}
          lastSync="1 hr ago"
        />
        <DeviceStatus
          name="Apple Watch Series 9"
          connected={false}
          lastSync="6 hrs ago"
        />
      </Section>

      <Section title="Battery Life" onEdit={() => handleEditSection("battery") }>
        <InfoRow label="Primary Monitor" value="Checked in 4 min ago" />
        <InfoRow label="Blood Pressure Cuff" value="Checked in 1 hr ago" />
        <InfoRow label="Smart Watch" value="Checked in 6 hrs ago" />
        <InfoRow label="Estimated Monitor Life" value="~11 months" />
        <div style={{ paddingTop: 2, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
          Last check-in summary: Today, 8:52 AM
        </div>
      </Section>

      {/* Medications */}
      <Section title="Current Medications">
        {[
          { name: "Lisinopril", dose: "10 mg · Once daily" },
          { name: "Carvedilol", dose: "6.25 mg · Twice daily" },
          { name: "Furosemide", dose: "40 mg · Once daily" },
          { name: "Spironolactone", dose: "25 mg · Once daily" },
        ].map((med, i, arr) => (
          <div
            key={med.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "11px 0",
              borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{med.name}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{med.dose}</div>
            </div>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)" }} />
          </div>
        ))}
      </Section>

      {/* Emergency contact */}
      <div
        style={{
          background: "rgba(26,108,240,0.07)",
          border: "1px solid rgba(26,108,240,0.2)",
          borderRadius: 14,
          padding: "14px 16px",
        }}
      >
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
          Emergency Contact
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Jane Doe (Spouse)</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--blue-bright)", marginTop: 4 }}>(312) 555-0189</div>
        <button
          style={{
            marginTop: 12,
            width: "100%",
            padding: "11px",
            background: "transparent",
            border: "1px solid rgba(26,108,240,0.3)",
            borderRadius: 10,
            fontFamily: "var(--sans)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--blue-bright)",
          }}
        >
          Call Emergency Contact
        </button>
      </div>

      {/* Edit SideSheet */}
      <SideSheet
        isOpen={editOpen}
        title={editingSection ? `Edit ${editingSection}` : "Edit Profile"}
        onClose={() => setEditOpen(false)}
        actions={{
          secondary: { label: "Cancel", onClick: () => setEditOpen(false) },
          primary: { label: "Save Changes", onClick: () => setEditOpen(false) },
        }}
      >
        <div style={{ fontSize: 13, color: "var(--text-sub)", lineHeight: 1.6 }}>
          {editingSection === "clinical" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 6, color: "var(--text-muted)" }}>
                  Diagnosis
                </label>
                <input type="text" defaultValue="CHF — Stage II" style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", color: "var(--text)" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 6, color: "var(--text-muted)" }}>
                  Primary Physician
                </label>
                <input type="text" defaultValue="Dr Doof" style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", color: "var(--text)" }} />
              </div>
            </div>
          )}
          {editingSection === "targets" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 6, color: "var(--text-muted)" }}>
                  Target Heart Rate (bpm)
                </label>
                <input type="text" defaultValue="60–100" style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", color: "var(--text)" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 6, color: "var(--text-muted)" }}>
                  Target Blood Pressure (mmHg)
                </label>
                <input type="text" defaultValue="&lt; 130/80" style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", color: "var(--text)" }} />
              </div>
            </div>
          )}
          {editingSection === "battery" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 6, color: "var(--text-muted)" }}>
                  Primary Monitor Battery (%)
                </label>
                <input type="text" defaultValue="82" style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", color: "var(--text)" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 6, color: "var(--text-muted)" }}>
                  Estimated Monitor Life
                </label>
                <input type="text" defaultValue="~11 months" style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", color: "var(--text)" }} />
              </div>
            </div>
          )}
          {!editingSection && (
            <p>Select a section to edit your profile information.</p>
          )}
        </div>
      </SideSheet>
    </div>
  )
}
