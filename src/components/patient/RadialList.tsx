interface RadialListItem {
  id: string
  label: string
  value?: string | React.ReactNode
  color?: string
  badge?: string
  badgeColor?: string
  actions?: { label: string; onClick: () => void }[]
}

interface RadialListProps {
  items: RadialListItem[]
  emptyMessage?: string
  isEditable?: boolean
}

export default function RadialList({ items, emptyMessage = "No items found", isEditable }: RadialListProps) {
  if (items.length === 0) {
    return (
      <div style={{ padding: "20px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{emptyMessage}</div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {items.map((item, index) => (
        <div
          key={item.id}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 0",
            borderBottom: index < items.length - 1 ? "1px solid var(--border)" : "none",
            gap: 10,
          }}
        >
          {/* Left bar */}
          {item.color && <div style={{ width: 3, height: 40, background: item.color, borderRadius: 2, flexShrink: 0 }} />}

          {/* Content */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "var(--mono)",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 10,
                    background: item.badgeColor || "rgba(79,195,247,0.15)",
                    color: item.badgeColor ? "white" : "var(--blue-bright)",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>
            {item.value && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.value}</div>}
          </div>

          {/* Actions */}
          {isEditable && item.actions && (
            <div style={{ display: "flex", gap: 4 }}>
              {item.actions.map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  style={{
                    padding: "6px 10px",
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
