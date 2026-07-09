import { useState } from "react"
import { ecgExamples, type EcgExample, type EcgLabel } from "../data/ecg"

type Filter = "all" | "AFIB" | "N"

function ClassBadge({ label }: { label: EcgLabel }) {
  const isAfib = label === "AFIB"
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        padding: "3px 10px",
        borderRadius: 999,
        background: isAfib ? "rgba(205, 0, 37, 0.10)" : "rgba(0, 139, 93, 0.10)",
        color: isAfib ? "var(--danger)" : "var(--ok)",
        border: `1px solid ${isAfib ? "rgba(205,0,37,0.22)" : "rgba(0,139,93,0.22)"}`,
      }}
    >
      {label === "AFIB" ? "AFIB" : "No AFIB"}
    </span>
  )
}

function EcgImageStrip({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      style={{
        overflowX: "auto",
        overflowY: "hidden",
        borderRadius: 8,
        border: "1px solid rgba(20, 15, 75, 0.12)",
        background: "#fff",
        cursor: "grab",
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          height: 160,
          width: "auto",
          maxWidth: "none",
          display: "block",
        }}
        draggable={false}
      />
    </div>
  )
}

function ExampleCard({ example, index }: { example: EcgExample; index: number }) {
  const [activeView, setActiveView] = useState<"raw" | "gradcam">("raw")
  const isAfib = example.gradcamClass === "AFIB"

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.84)",
        border: "1px solid rgba(20, 15, 75, 0.14)",
        borderLeft: `3px solid ${isAfib ? "var(--danger)" : "var(--ok)"}`,
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(20, 15, 75, 0.06)",
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid rgba(20, 15, 75, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 700,
              color: "var(--text-subtle)",
              letterSpacing: "0.08em",
            }}
          >
            #{String(index + 1).padStart(2, "0")} · {example.recordId}
          </span>
        </div>
        <ClassBadge label={example.gradcamClass} />
      </div>

      {/* View toggle */}
      <div style={{ display: "flex", padding: "10px 16px 0", gap: 6 }}>
        {(["raw", "gradcam"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            style={{
              border: "1px solid rgba(20, 15, 75, 0.18)",
              background: activeView === v ? "var(--primary-base)" : "#fff",
              color: activeView === v ? "#fff" : "var(--text-mid)",
              borderRadius: 6,
              padding: "4px 10px",
              fontFamily: "var(--font-ui)",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {v === "raw" ? "Raw ECG" : "Grad-CAM"}
          </button>
        ))}
      </div>

      {/* ECG image strip */}
      <div style={{ padding: "10px 16px 14px" }}>
        {activeView === "raw" ? (
          <EcgImageStrip src={example.rawImage} alt={`Raw ECG for ${example.recordId}`} />
        ) : (
          <>
            <EcgImageStrip src={example.gradcamImage} alt={`Grad-CAM for ${example.recordId}`} />
            <div
              style={{
                marginTop: 8,
                fontFamily: "var(--font-ui)",
                fontSize: 11,
                color: "var(--text-subtle)",
                lineHeight: 1.5,
              }}
            >
              Red regions indicate the signal segments most influential in the model&apos;s{" "}
              <strong style={{ color: isAfib ? "var(--danger)" : "var(--ok)" }}>
                {example.gradcamClass === "AFIB" ? "AFIB" : "No AFIB"}
              </strong>{" "}
              classification.
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function EcgAnalysis() {
  const [filter, setFilter] = useState<Filter>("all")

  const filtered = ecgExamples.filter((e) =>
    filter === "all" ? true : e.gradcamClass === filter,
  )

  const afibCount = ecgExamples.filter((e) => e.gradcamClass === "AFIB").length
  const nCount = ecgExamples.filter((e) => e.gradcamClass === "N").length

  return (
    <div style={{ padding: "20px 20px 32px", maxWidth: 900 }}>
      {/* Section header */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 700,
            color: "var(--text-strong)",
            marginBottom: 4,
          }}
        >
          AI ECG Analysis
        </div>
        <div style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--text-subtle)", lineHeight: 1.6 }}>
          Model trained on 11,000 min of ECG data from the{" "}
          <a
            href="https://physionet.org/content/afdb/1.0.0/"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--primary-base)", textDecoration: "none" }}
          >
            PhysioNet AF Database
          </a>
          . Grad-CAM highlights regions driving each prediction.
        </div>
      </div>

      {/* Filter + stats */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        {([
          { id: "all", label: `All (${ecgExamples.length})` },
          { id: "AFIB", label: `AFIB (${afibCount})` },
          { id: "N", label: `No AFIB (${nCount})` },
        ] as { id: Filter; label: string }[]).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              border: "1px solid rgba(20, 15, 75, 0.18)",
              background: filter === f.id ? "var(--primary-base)" : "#fff",
              color: filter === f.id ? "#fff" : "var(--text-mid)",
              borderRadius: 999,
              padding: "5px 12px",
              fontFamily: "var(--font-ui)",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Example cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.map((example, i) => (
          <ExampleCard key={example.datasetIndex} example={example} index={ecgExamples.indexOf(example)} />
        ))}
      </div>
    </div>
  )
}
