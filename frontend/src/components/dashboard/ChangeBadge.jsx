import { formatPercent } from "../../utils/formatters";

export function ChangeBadge({ value }) {
  const className = value > 0.05 ? "positive" : value < -0.05 ? "negative" : "neutral";
  return <span className={`change-badge ${className}`}>{formatPercent(value)}</span>;
}
