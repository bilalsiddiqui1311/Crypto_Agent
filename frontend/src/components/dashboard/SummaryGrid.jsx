import { Activity, CircleDollarSign, ShieldCheck, TrendingUp } from "lucide-react";

import { MetricTile } from "../common/MetricTile";
import { formatPercent } from "../../utils/formatters";

export function SummaryGrid({ summary }) {
  return (
    <section className="summary-grid" aria-label="Market summary">
      <MetricTile icon={Activity} label="Market Pulse" value={summary.pulse} detail={summary.pulseDetail} />
      <MetricTile
        icon={TrendingUp}
        label="Average 24h Move"
        value={formatPercent(summary.avgMove)}
        detail="Across tracked assets"
      />
      <MetricTile icon={CircleDollarSign} label="Best Performer" value={summary.bestSymbol} detail={summary.bestDetail} />
      <MetricTile icon={ShieldCheck} label="Risk Heat" value={summary.riskHeat} detail={summary.riskDetail} />
    </section>
  );
}
