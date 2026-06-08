import { CoinImage } from "./CoinImage";
import { ChangeBadge } from "./ChangeBadge";
import { Sparkline } from "./Sparkline";
import { formatCurrency } from "../../utils/formatters";

export function CoinCard({ coin, currency, active, onClick }) {
  return (
    <button className={`coin-card ${active ? "active" : ""}`} type="button" onClick={onClick}>
      <span className="coin-card-top">
        <span className="coin-identity">
          <CoinImage coin={coin} />
          <span>
            <strong className="coin-name">{coin.name}</strong>
            <small className="coin-symbol">{coin.symbol}</small>
          </span>
        </span>
        <span className={`category-chip ${coin.category}`}>{coin.category || "asset"}</span>
      </span>
      <span className="coin-price">{formatCurrency(coin.current_price, currency)}</span>
      <span className="coin-details">
        <ChangeBadge value={coin.price_change_percentage_24h} />
        <span className="coin-range">
          #{coin.market_cap_rank || "--"} · {formatCurrency(coin.low_24h, currency)} - {formatCurrency(coin.high_24h, currency)}
        </span>
      </span>
      <span className="sparkline" aria-hidden="true">
        <Sparkline points={coin.sparkline} positive={coin.price_change_percentage_24h >= 0} />
      </span>
    </button>
  );
}
