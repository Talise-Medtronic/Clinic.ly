interface ManagementAction {
  label: string
  disabled?: boolean
  lockReason?: string
}

interface ManagementCardProps {
  icon: React.ReactNode
  title: string
  description?: string
  actions: ManagementAction[]
  onAction: (label: string) => void
}

export default function ManagementCard({ icon, title, description, actions, onAction }: ManagementCardProps) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header with icon */}
      <div
        style={{
          background: "linear-gradient(145deg, #140f4b 0%, #1010eb 100%)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          color: "white",
        }}
      >
        <div style={{ fontSize: 24 }}>{icon}</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "white" }}>{title}</div>
          {description && <div style={{ fontSize: 11, opacity: 0.85 }}>{description}</div>}
        </div>
      </div>

      {/* Action rows */}
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => !action.disabled && onAction(action.label)}
            disabled={action.disabled}
            title={action.lockReason}
            style={{
              padding: "10px 12px",
              background: action.disabled ? "var(--surface-2)" : "rgba(79,195,247,0.08)",
              border: "1px solid",
              borderColor: action.disabled ? "var(--border)" : "rgba(79,195,247,0.3)",
              borderRadius: 8,
              fontFamily: "var(--sans)",
              fontSize: 13,
              fontWeight: 500,
              color: action.disabled ? "var(--text-muted)" : "var(--text)",
              cursor: action.disabled ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "all 0.15s",
            }}
          >
            <span>{action.label}</span>
            {action.disabled && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
