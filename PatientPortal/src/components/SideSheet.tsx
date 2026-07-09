import { ReactNode } from "react"

interface SideSheetProps {
  isOpen: boolean
  title: string
  onClose: () => void
  actions?: {
    primary?: { label: string; onClick: () => void; disabled?: boolean }
    secondary?: { label: string; onClick: () => void }
  }
  children: ReactNode
}

export default function SideSheet({ isOpen, title, onClose, actions, children }: SideSheetProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 99,
            animation: "fadeIn 0.15s ease",
          }}
        />
      )}

      {/* Side Sheet */}
      <div
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          height: "100%",
          width: "100%",
          maxWidth: 430,
          background: "var(--bg)",
          boxShadow: "-4px 0 16px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          zIndex: 100,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            borderBottom: "1px solid var(--border)",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: 20,
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>{children}</div>

        {/* Actions */}
        {actions && (
          <div
            style={{
              borderTop: "1px solid var(--border)",
              padding: "12px 16px",
              display: "flex",
              gap: 8,
              flexShrink: 0,
            }}
          >
            {actions.secondary && (
              <button
                onClick={actions.secondary.onClick}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontFamily: "var(--sans)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {actions.secondary.label}
              </button>
            )}
            {actions.primary && (
              <button
                onClick={actions.primary.onClick}
                disabled={actions.primary.disabled}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: actions.primary.disabled ? "var(--surface-2)" : "var(--blue)",
                  border: "none",
                  borderRadius: 8,
                  fontFamily: "var(--sans)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: actions.primary.disabled ? "var(--text-muted)" : "white",
                  cursor: actions.primary.disabled ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                {actions.primary.label}
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  )
}
