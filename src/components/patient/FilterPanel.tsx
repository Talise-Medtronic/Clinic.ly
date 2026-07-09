interface FilterOption {
  id: string
  label: string
  checked: boolean
}

interface FilterPanelProps {
  isOpen: boolean
  filters: Record<string, FilterOption[]>
  onFilterChange: (category: string, filterId: string) => void
  onApply: () => void
  onClear: () => void
}

export default function FilterPanel({ isOpen, filters, onFilterChange, onApply, onClear }: FilterPanelProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "14px",
        marginBottom: 12,
      }}
    >
      {/* Filter sections */}
      {Object.entries(filters).map(([category, options]) => (
        <div key={category} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontFamily: "var(--mono)", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
            {category}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {options.map((option) => (
              <label
                key={option.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={option.checked}
                  onChange={() => onFilterChange(category, option.id)}
                  style={{
                    width: 16,
                    height: 16,
                    cursor: "pointer",
                    accentColor: "var(--blue)",
                  }}
                />
                <span style={{ fontSize: 13, color: "var(--text-sub)" }}>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          onClick={onClear}
          style={{
            flex: 1,
            padding: "10px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontFamily: "var(--sans)",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-muted)",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          Clear
        </button>
        <button
          onClick={onApply}
          style={{
            flex: 1,
            padding: "10px",
            background: "var(--blue)",
            border: "none",
            borderRadius: 8,
            fontFamily: "var(--sans)",
            fontSize: 12,
            fontWeight: 600,
            color: "white",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          Apply
        </button>
      </div>
    </div>
  )
}
