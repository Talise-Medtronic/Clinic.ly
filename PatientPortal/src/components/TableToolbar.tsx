interface TableToolbarProps {
  searchPlaceholder?: string
  searchValue: string
  onSearchChange: (value: string) => void
  onFilterToggle: () => void
  onAddAction?: () => void
  filterActive?: boolean
}

export default function TableToolbar({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  onFilterToggle,
  onAddAction,
  filterActive,
}: TableToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        padding: "12px 16px",
        background: "var(--surface-2)",
        borderRadius: 12,
        marginBottom: 12,
      }}
    >
      {/* Search input */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)", paddingLeft: 10 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            flex: 1,
            background: "none",
            border: "none",
            padding: "10px 0",
            fontFamily: "var(--sans)",
            fontSize: 13,
            color: "var(--text)",
            outline: "none",
          }}
        />
      </div>

      {/* Filter button */}
      <button
        onClick={onFilterToggle}
        style={{
          padding: "8px 10px",
          background: filterActive ? "var(--blue)" : "var(--surface)",
          border: "1px solid",
          borderColor: filterActive ? "var(--blue)" : "var(--border)",
          borderRadius: 8,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: filterActive ? "white" : "var(--text-muted)",
          transition: "all 0.15s",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      </button>

      {/* Add button */}
      {onAddAction && (
        <button
          onClick={onAddAction}
          style={{
            padding: "8px 12px",
            background: "var(--blue)",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            color: "white",
            fontFamily: "var(--sans)",
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add
        </button>
      )}
    </div>
  )
}
