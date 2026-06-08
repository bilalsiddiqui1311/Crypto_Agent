import { useState } from "react";

import { CHART_RANGES } from "../../constants/market";
import { EmptyState } from "../common/EmptyState";
import { AssetStrip } from "./AssetStrip";
import { PriceChart } from "./PriceChart";
import { RangeMeter } from "./RangeMeter";

export function ChartPanel({ selectedCoin, currency }) {
  const [range, setRange] = useState(7);

  return (
    <section className="chart-panel" aria-labelledby="chartHeading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Highs, lows, and momentum</p>
          <h2 id="chartHeading">Selected asset</h2>
        </div>
        <div className="timeframe-tabs" role="tablist" aria-label="Chart range">
          {CHART_RANGES.map((days) => (
            <button
              key={days}
              className={`range-button ${range === days ? "active" : ""}`}
              type="button"
              onClick={() => setRange(days)}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      {selectedCoin ? (
        <>
          <AssetStrip coin={selectedCoin} currency={currency} />
          <div className="chart-wrap">
            <PriceChart coin={selectedCoin} range={range} currency={currency} />
          </div>
          <RangeMeter coin={selectedCoin} currency={currency} />
        </>
      ) : (
        <EmptyState text="Market data appears after the backend responds." />
      )}
    </section>
  );
}
