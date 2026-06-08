export function expandSeriesForRange(coin, range) {
  const base = coin.sparkline?.length ? coin.sparkline : makeSparkline(coin.current_price, coin.price_change_percentage_7d, 2);
  if (range === 7) return base;

  const target = range === 30 ? 300 : 360;
  const monthlyChange = coin.price_change_percentage_30d || coin.price_change_percentage_7d * 2.2;
  const start = coin.current_price / Math.max(0.2, 1 + monthlyChange / 100);

  return Array.from({ length: target }, (_, index) => {
    const progress = index / (target - 1);
    const basePoint = base[Math.floor(progress * (base.length - 1))] || coin.current_price;
    const drift = start + (coin.current_price - start) * progress;
    const blend = range === 30 ? 0.65 : 0.35;
    const cycle = Math.sin(index / 13) * coin.current_price * 0.01 + Math.cos(index / 31) * coin.current_price * 0.012;
    return Math.max(0.0001, drift * (1 - blend) + basePoint * blend + cycle);
  });
}

export function makeSparkline(price, change, seed) {
  const start = price / Math.max(0.1, 1 + change / 100);
  return Array.from({ length: 168 }, (_, index) => {
    const progress = index / 167;
    const wave = Math.sin(index / (8 + seed)) * 0.014 + Math.cos(index / (15 + seed)) * 0.01;
    const drift = (price - start) * progress;
    return Math.max(0.0001, start + drift + price * wave);
  });
}
