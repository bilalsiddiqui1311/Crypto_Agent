import { EmptyState } from "../common/EmptyState";
import { clamp } from "../../utils/math";
import { formatCurrency } from "../../utils/formatters";

export function ScenarioGrid({ scenarios, currency }) {
  if (!scenarios.length) {
    return <EmptyState text="Scenarios appear after the backend analyzes your selected asset." />;
  }

  return (
    <div className="scenario-grid">
      {scenarios.map((scenario) => (
        <article className="scenario-card" key={scenario.horizon}>
          <h3>{scenario.horizon}</h3>
          {scenario.rows.map((row) => (
            <div className={`scenario-row ${row.kind}-row`} key={row.kind}>
              <span>{row.label}</span>
              <span className="scenario-bar">
                <span style={{ width: `${clamp(45 + row.move_percent * 0.7, 12, 100)}%` }} />
              </span>
              <strong>{formatCurrency(row.price, currency)}</strong>
            </div>
          ))}
          <p className="scenario-note">
            {formatCurrency(scenario.base_portfolio_value, currency)} possible portfolio value in the base case.
          </p>
        </article>
      ))}
    </div>
  );
}
