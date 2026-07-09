import { ReactNode } from "react"

interface DetailCardProps {
  title: string
  icon?: React.ReactNode
  actions?: { label: string; onClick: () => void; disabled?: boolean }[]
  children: ReactNode
}

export default function DetailCard({ title, icon, actions, children }: DetailCardProps) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface-2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {icon && <div style={{ fontSize: 18 }}>{icon}</div>}
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: 0 }}>{title}</h3>
        </div>

        {actions && (
          <div style={{ display: "flex", gap: 6 }}>
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                disabled={action.disabled}
                style={{
                  padding: "6px 10px",
                  background: action.disabled ? "var(--surface)" : "rgba(79,195,247,0.08)",
                  border: "1px solid",
                  borderColor: action.disabled ? "var(--border)" : "rgba(79,195,247,0.3)",
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 600,
                  color: action.disabled ? "var(--text-muted)" : "var(--blue-bright)",
                  cursor: action.disabled ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px" }}>{children}</div>
    </div>
  )
}
