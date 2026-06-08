import { ScenarioGrid } from "./ScenarioGrid";

export function ForecastPanel({ scenarios, currency }) {
  return (
    <section className="forecast-panel" id="forecast" aria-labelledby="forecastHeading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Possibility map</p>
          <h2 id="forecastHeading">1 month, 3 months, and 1 year scenarios</h2>
        </div>
        <div className="scenario-legend">
          <span><i className="legend-dot bear" />Bear</span>
          <span><i className="legend-dot base" />Base</span>
          <span><i className="legend-dot bull" />Bull</span>
        </div>
      </div>
      <ScenarioGrid scenarios={scenarios} currency={currency} />
      <p className="disclaimer">
        Educational analysis only. Crypto is volatile, projections are possibilities rather than guarantees, and
        this is not financial advice.
      </p>
    </section>
  );
}
