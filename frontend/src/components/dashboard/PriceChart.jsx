import { useEffect, useRef } from "react";

import { drawPriceChart } from "../../utils/canvasCharts";
import { expandSeriesForRange } from "../../utils/chartSeries";

export function PriceChart({ coin, range, currency }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    drawPriceChart(canvasRef.current, expandSeriesForRange(coin, range), coin, range, currency);
  }, [coin, range, currency]);

  return <canvas ref={canvasRef} aria-label={`${coin.name} price chart`} />;
}
