import { average } from "./math";
import { formatPercent } from "./formatters";

export function buildSummary(coins) {
  if (!coins.length) {
    return {
      pulse: "Loading",
      pulseDetail: "Fetching backend market data",
      avgMove: 0,
      bestSymbol: "--",
      bestDetail: "24h change",
      riskHeat: "--",
      riskDetail: "Volatility reading"
    };
  }

  const avgMove = average(coins.map((coin) => coin.price_change_percentage_24h));
  const best = [...coins].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)[0];
  const volatility = average(coins.map(rangeVolatility));
  const risingCount = coins.filter((coin) => coin.price_change_percentage_24h >= 0).length;

  return {
    pulse: avgMove > 1.2 ? "Bullish" : avgMove < -1.2 ? "Defensive" : "Mixed",
    pulseDetail: `${risingCount} of ${coins.length} tracked assets are green today`,
    avgMove,
    bestSymbol: best?.symbol || "--",
    bestDetail: best ? `${best.name} ${formatPercent(best.price_change_percentage_24h)}` : "24h change",
    riskHeat: volatility > 7 ? "High" : volatility > 3.5 ? "Medium" : "Low",
    riskDetail: `Average 24h range ${formatPercent(volatility)}`
  };
}

export function rangeVolatility(coin) {
  return ((coin.high_24h - coin.low_24h) / Math.max(coin.current_price, 0.0001)) * 100;
}
