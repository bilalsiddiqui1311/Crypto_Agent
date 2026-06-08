import { clamp } from "../../utils/math";
import { formatCurrency } from "../../utils/formatters";

export function RangeMeter({ coin, currency }) {
  const position = clamp((coin.current_price - coin.low_24h) / Math.max(coin.high_24h - coin.low_24h, 0.0001), 0, 1);
  return (
    <div className="range-meter" aria-label="24 hour price range">
      <div className="range-meter-labels">
        <span>Low: {formatCurrency(coin.low_24h, currency)}</span>
        <strong>24h Low / High</strong>
        <span>High: {formatCurrency(coin.high_24h, currency)}</span>
      </div>
      <div className="range-track">
        <span className="range-fill" style={{ width: `${position * 100}%` }} />
        <span className="range-marker" style={{ left: `${position * 100}%` }} />
      </div>
    </div>
  );
}
