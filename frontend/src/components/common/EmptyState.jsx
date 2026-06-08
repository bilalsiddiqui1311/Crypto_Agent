import { Target } from "lucide-react";

export function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <Target size={20} />
      <span>{text}</span>
    </div>
  );
}
