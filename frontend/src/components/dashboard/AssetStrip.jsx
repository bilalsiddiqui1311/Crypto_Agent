import { ChangeBadge } from "./ChangeBadge";
import { CoinImage } from "./CoinImage";
import { formatCurrency } from "../../utils/formatters";

export function AssetStrip({ coin, currency }) {
  return (
    <div className="asset-strip">
      <div className="asset-title">
        <CoinImage coin={coin} large />
        <div>
          <strong>{coin.name}</strong>
          <span>{coin.symbol} · {coin.category}</span>
        </div>
      </div>
      <div className="asset-price-block">
        <strong>{formatCurrency(coin.current_price, currency)}</strong>
        <ChangeBadge value={coin.price_change_percentage_24h} />
      </div>
    </div>
  );
}
