import { TrendingUp } from "lucide-react";

import { CoinCard } from "./CoinCard";
import { formatTime } from "../../utils/formatters";

export function MarketPanel({
  market,
  coins,
  visibleCoins,
  selectedCoin,
  currency,
  visibleCoinCount,
  onSelectCoin,
  onLoadMore
}) {
  return (
    <section className="market-panel" aria-labelledby="marketHeading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Realtime prices</p>
          <h2 id="marketHeading">Tracked crypto assets</h2>
        </div>
        <div className="last-updated">
          {market ? `Showing ${visibleCoins.length} of ${coins.length} · Updated ${formatTime(market.updated_at)}` : "Not updated yet"}
        </div>
      </div>
      <div className="coin-grid" aria-live="polite">
        {visibleCoins.map((coin) => (
          <CoinCard
            key={coin.id}
            coin={coin}
            currency={currency}
            active={coin.id === selectedCoin?.id}
            onClick={() => onSelectCoin(coin)}
          />
        ))}
      </div>
      {visibleCoinCount < coins.length && (
        <button className="load-more-button" type="button" onClick={onLoadMore}>
          <TrendingUp size={18} />
          <span>Load more assets</span>
          <small>{coins.length - visibleCoinCount} remaining</small>
        </button>
      )}
    </section>
  );
}
