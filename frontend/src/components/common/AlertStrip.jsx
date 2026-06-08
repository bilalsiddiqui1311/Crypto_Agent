import { AlertTriangle } from "lucide-react";

export function AlertStrip({ children, compact = false }) {
  if (!children) return null;

  return (
    <div className={`alert-strip ${compact ? "compact" : ""}`} role="alert">
      <AlertTriangle size={18} />
      <span>{children}</span>
    </div>
  );
}
