import { LogOut, Moon, RefreshCw, Sun } from "lucide-react";

import { CURRENCY_OPTIONS } from "../../constants/market";

export function Topbar({
  session,
  market,
  currency,
  autoRefresh,
  theme,
  loadingMarket,
  onCurrencyChange,
  onAutoRefreshChange,
  onToggleTheme,
  onRefresh,
  onLogout
}) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Live crypto market intelligence</p>
        <h1>Crypto AI Market Analyst</h1>
        <p className="signed-in-line">Signed in as {session.user.full_name}</p>
      </div>
      <div className="topbar-actions">
        <div className={`source-pill ${market?.source === "live" ? "live" : "fallback"}`}>
          <span className="status-dot" />
          <span>{market?.source === "live" ? "Live CoinGecko" : market ? "Fallback data" : "Connecting"}</span>
        </div>
        <label className="currency-control">
          <span>Currency</span>
          <select value={currency} onChange={(event) => onCurrencyChange(event.target.value)}>
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="auto-control">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(event) => onAutoRefreshChange(event.target.checked)}
          />
          <span>Auto</span>
        </label>
        <button className="icon-button ghost" type="button" onClick={onToggleTheme}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>
        <button className="icon-button" type="button" onClick={onRefresh} disabled={loadingMarket}>
          <RefreshCw size={18} />
          <span>{loadingMarket ? "Loading" : "Refresh"}</span>
        </button>
        <button className="icon-button ghost" type="button" onClick={onLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
