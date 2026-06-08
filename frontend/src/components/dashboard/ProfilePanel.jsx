import { Save } from "lucide-react";

import { RISK_OPTIONS, STRATEGY_OPTIONS } from "../../constants/profile";
import { Field } from "../common/Field";

export function ProfilePanel({ profile, coins, profileStatus, onProfileChange, onSaveProfile }) {
  return (
    <section className="profile-panel" id="portfolio" aria-labelledby="portfolioHeading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Investor profile</p>
          <h2 id="portfolioHeading">Tell the assistant about your investment</h2>
        </div>
        <button className="icon-button ghost" type="button" onClick={onSaveProfile}>
          <Save size={18} />
          <span>{profileStatus || "Save"}</span>
        </button>
      </div>

      <form className="investment-form">
        <Field label="Available investment">
          <input
            type="number"
            min="0"
            step="50"
            value={profile.investment_amount}
            onChange={(event) => onProfileChange("investment_amount", event.target.value)}
          />
        </Field>
        <Field label="Monthly contribution">
          <input
            type="number"
            min="0"
            step="25"
            value={profile.monthly_contribution}
            onChange={(event) => onProfileChange("monthly_contribution", event.target.value)}
          />
        </Field>
        <Field label="Main holding">
          <select value={profile.holding_coin} onChange={(event) => onProfileChange("holding_coin", event.target.value)}>
            {coins.map((coin) => (
              <option key={coin.id} value={coin.id}>
                {coin.name} ({coin.symbol})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Amount already invested">
          <input
            type="number"
            min="0"
            step="25"
            value={profile.holding_amount}
            onChange={(event) => onProfileChange("holding_amount", event.target.value)}
          />
        </Field>
        <Field label="Risk comfort">
          <select value={profile.risk_profile} onChange={(event) => onProfileChange("risk_profile", event.target.value)}>
            {RISK_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Strategy style">
          <select value={profile.strategy_style} onChange={(event) => onProfileChange("strategy_style", event.target.value)}>
            {STRATEGY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <label className="wide-label">
          <span>Goal or concern</span>
          <textarea
            rows="3"
            value={profile.investor_goal}
            onChange={(event) => onProfileChange("investor_goal", event.target.value)}
            placeholder="Example: I want medium risk exposure and want to avoid buying after a sharp pump."
          />
        </label>
      </form>
    </section>
  );
}
