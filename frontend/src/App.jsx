import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CalendarClock,
  CircleDollarSign,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  Moon,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  User,
  UserPlus,
  Wallet
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";

const currencySymbols = {
  usd: "$",
  eur: "€",
  gbp: "£",
  pkr: "Rs ",
  inr: "₹"
};

const defaultProfile = {
  currency: "usd",
  investment_amount: 1000,
  monthly_contribution: 150,
  holding_coin: "bitcoin",
  holding_amount: 0,
  risk_profile: "balanced",
  strategy_style: "dca",
  investor_goal: ""
};

const INITIAL_VISIBLE_COINS = 8;
const COINS_PER_LOAD = 8;

export default function App() {
  const [session, setSession] = useState(() => loadSession());
  const [booting, setBooting] = useState(Boolean(loadSession()?.token));
  const [theme, setTheme] = useState(() => loadSession()?.user?.theme || localStorage.getItem("crypto-ai-theme") || "light");
  const [currency, setCurrency] = useState(() => loadSession()?.profile?.currency || "usd");
  const [market, setMarket] = useState(null);
  const [selectedId, setSelectedId] = useState(() => loadSession()?.profile?.holding_coin || "bitcoin");
  const [range, setRange] = useState(7);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [visibleCoinCount, setVisibleCoinCount] = useState(INITIAL_VISIBLE_COINS);
  const [profile, setProfile] = useState(() => ({ ...defaultProfile, ...(loadSession()?.profile || {}) }));
  const [analysis, setAnalysis] = useState(null);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [profileStatus, setProfileStatus] = useState("");
  const [error, setError] = useState("");

  const coins = market?.coins || [];
  const visibleCoins = coins.slice(0, visibleCoinCount);
  const selectedCoin = useMemo(
    () => coins.find((coin) => coin.id === selectedId) || coins[0],
    [coins, selectedId]
  );
  const summary = useMemo(() => buildSummary(coins), [coins]);
  const token = session?.token;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("crypto-ai-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!token) {
      setBooting(false);
      return;
    }

    let active = true;
    apiFetch("/api/auth/me", { token })
      .then((payload) => {
        if (!active) return;
        const nextSession = { token, user: payload.user, profile: payload.profile };
        persistSession(nextSession);
        setSession(nextSession);
        hydrateProfile(payload.profile);
        setTheme(payload.user.theme || theme);
      })
      .catch(() => {
        if (!active) return;
        clearSession();
        setSession(null);
      })
      .finally(() => {
        if (active) setBooting(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!session) return;
    setVisibleCoinCount(INITIAL_VISIBLE_COINS);
    fetchMarket();
  }, [currency, session]);

  useEffect(() => {
    if (!session || !autoRefresh) return undefined;
    const interval = window.setInterval(fetchMarket, 60_000);
    return () => window.clearInterval(interval);
  }, [autoRefresh, currency, session]);

  useEffect(() => {
    if (!session || !selectedCoin) return undefined;
    const timer = window.setTimeout(() => fetchAnalysis(selectedCoin, profile), 260);
    return () => window.clearTimeout(timer);
  }, [selectedCoin, profile, currency, session]);

  useEffect(() => {
    if (selectedCoin && !profile.holding_coin) {
      setProfile((current) => ({ ...current, holding_coin: selectedCoin.id }));
    }
  }, [selectedCoin, profile.holding_coin]);

  function hydrateProfile(nextProfile) {
    const merged = { ...defaultProfile, ...nextProfile };
    setProfile(merged);
    setCurrency(merged.currency || "usd");
    setSelectedId(merged.holding_coin || "bitcoin");
  }

  function handleAuth(nextSession) {
    persistSession(nextSession);
    setSession(nextSession);
    hydrateProfile(nextSession.profile);
    setTheme(nextSession.user.theme || "light");
    setError("");
  }

  function handleLogout() {
    clearSession();
    setSession(null);
    setMarket(null);
    setAnalysis(null);
    setProfile({ ...defaultProfile });
    setCurrency("usd");
  }

  async function fetchMarket() {
    setLoadingMarket(true);
    setError("");

    try {
      const payload = await apiFetch(`/api/market?currency=${currency}`);
      setMarket(payload);
      if (!payload.coins.some((coin) => coin.id === selectedId)) {
        setSelectedId(payload.coins[0]?.id || "bitcoin");
      }
      if (!profile.holding_coin && payload.coins[0]?.id) {
        setProfile((current) => ({ ...current, holding_coin: payload.coins[0].id }));
      }
    } catch (requestError) {
      setError(`Backend unavailable: ${requestError.message}`);
    } finally {
      setLoadingMarket(false);
    }
  }

  async function fetchAnalysis(coin, nextProfile) {
    if (!token) return;
    setLoadingAnalysis(true);

    try {
      const payload = await apiFetch("/api/analyze", {
        token,
        method: "POST",
        body: { currency, coin, profile: { ...nextProfile, currency } }
      });
      setAnalysis(payload);
      setError("");
    } catch (requestError) {
      if (requestError.status === 401) {
        handleLogout();
        setError("Please log in again to continue.");
      } else {
        setError(`Analysis unavailable: ${requestError.message}`);
      }
    } finally {
      setLoadingAnalysis(false);
    }
  }

  function updateProfile(field, value) {
    const numericFields = ["investment_amount", "monthly_contribution", "holding_amount"];
    setProfileStatus("");
    setProfile((current) => ({
      ...current,
      currency,
      [field]: numericFields.includes(field) ? Number(value || 0) : value
    }));
  }

  async function saveProfile() {
    if (!token) return;

    try {
      const saved = await apiFetch("/api/profile", {
        token,
        method: "PUT",
        body: { ...profile, currency }
      });
      const nextSession = { ...session, profile: saved };
      persistSession(nextSession);
      setSession(nextSession);
      hydrateProfile(saved);
      setProfileStatus("Saved to database");
      window.setTimeout(() => setProfileStatus(""), 1600);
    } catch (requestError) {
      setError(`Could not save profile: ${requestError.message}`);
    }
  }

  async function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);

    if (!token) return;
    try {
      const user = await apiFetch("/api/theme", {
        token,
        method: "PUT",
        body: { theme: nextTheme }
      });
      const nextSession = { ...session, user };
      persistSession(nextSession);
      setSession(nextSession);
    } catch {
      // Keep the local theme responsive even if the preference save is delayed.
    }
  }

  function changeCurrency(nextCurrency) {
    setCurrency(nextCurrency);
    setProfile((current) => ({ ...current, currency: nextCurrency }));
  }

  if (booting) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <AuthPage onAuth={handleAuth} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <div className="app-shell">
      <aside className="rail" aria-label="Application navigation">
        <div className="brand-mark">CA</div>
        <NavButton icon={BarChart3} label="Market" target="market" active />
        <NavButton icon={Wallet} label="Portfolio" target="portfolio" />
        <NavButton icon={CalendarClock} label="Forecast" target="forecast" />
        <NavButton icon={Brain} label="AI" target="assistant" />
      </aside>

      <main className="workspace">
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
              <select value={currency} onChange={(event) => changeCurrency(event.target.value)}>
                <option value="usd">USD</option>
                <option value="eur">EUR</option>
                <option value="gbp">GBP</option>
                <option value="pkr">PKR</option>
                <option value="inr">INR</option>
              </select>
            </label>
            <label className="auto-control">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(event) => setAutoRefresh(event.target.checked)}
              />
              <span>Auto</span>
            </label>
            <button className="icon-button ghost" type="button" onClick={toggleTheme}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
            <button className="icon-button" type="button" onClick={fetchMarket} disabled={loadingMarket}>
              <RefreshCw size={18} />
              <span>{loadingMarket ? "Loading" : "Refresh"}</span>
            </button>
            <button className="icon-button ghost" type="button" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {error && (
          <div className="alert-strip" role="alert">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <section className="summary-grid" aria-label="Market summary">
          <MetricTile icon={Activity} label="Market Pulse" value={summary.pulse} detail={summary.pulseDetail} />
          <MetricTile icon={TrendingUp} label="Average 24h Move" value={formatPercent(summary.avgMove)} detail="Across tracked assets" />
          <MetricTile icon={CircleDollarSign} label="Best Performer" value={summary.bestSymbol} detail={summary.bestDetail} />
          <MetricTile icon={ShieldCheck} label="Risk Heat" value={summary.riskHeat} detail={summary.riskDetail} />
        </section>

        <section className="dashboard-grid" id="market">
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
                  onClick={() => {
                    setSelectedId(coin.id);
                    setProfile((current) => ({ ...current, holding_coin: coin.id }));
                  }}
                />
              ))}
            </div>
            {visibleCoinCount < coins.length && (
              <button
                className="load-more-button"
                type="button"
                onClick={() => setVisibleCoinCount((count) => Math.min(count + COINS_PER_LOAD, coins.length))}
              >
                <TrendingUp size={18} />
                <span>Load more assets</span>
                <small>{coins.length - visibleCoinCount} remaining</small>
              </button>
            )}
          </section>

          <section className="chart-panel" aria-labelledby="chartHeading">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Highs, lows, and momentum</p>
                <h2 id="chartHeading">Selected asset</h2>
              </div>
              <div className="timeframe-tabs" role="tablist" aria-label="Chart range">
                {[7, 30, 90].map((days) => (
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
        </section>

        <section className="lower-grid">
          <section className="profile-panel" id="portfolio" aria-labelledby="portfolioHeading">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Investor profile</p>
                <h2 id="portfolioHeading">Tell the assistant about your investment</h2>
              </div>
              <button className="icon-button ghost" type="button" onClick={saveProfile}>
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
                  onChange={(event) => updateProfile("investment_amount", event.target.value)}
                />
              </Field>
              <Field label="Monthly contribution">
                <input
                  type="number"
                  min="0"
                  step="25"
                  value={profile.monthly_contribution}
                  onChange={(event) => updateProfile("monthly_contribution", event.target.value)}
                />
              </Field>
              <Field label="Main holding">
                <select value={profile.holding_coin} onChange={(event) => updateProfile("holding_coin", event.target.value)}>
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
                  onChange={(event) => updateProfile("holding_amount", event.target.value)}
                />
              </Field>
              <Field label="Risk comfort">
                <select value={profile.risk_profile} onChange={(event) => updateProfile("risk_profile", event.target.value)}>
                  <option value="conservative">Conservative</option>
                  <option value="balanced">Balanced</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </Field>
              <Field label="Strategy style">
                <select value={profile.strategy_style} onChange={(event) => updateProfile("strategy_style", event.target.value)}>
                  <option value="dca">Dollar-cost average</option>
                  <option value="lump">Lump sum</option>
                  <option value="rebalance">Rebalance existing portfolio</option>
                </select>
              </Field>
              <label className="wide-label">
                <span>Goal or concern</span>
                <textarea
                  rows="3"
                  value={profile.investor_goal}
                  onChange={(event) => updateProfile("investor_goal", event.target.value)}
                  placeholder="Example: I want medium risk exposure and want to avoid buying after a sharp pump."
                />
              </label>
            </form>
          </section>

          <section className="assistant-panel" id="assistant" aria-labelledby="assistantHeading">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">AI suggestion engine</p>
                <h2 id="assistantHeading">Analysis for your profile</h2>
              </div>
              <button
                className="icon-button ghost"
                type="button"
                disabled={!selectedCoin || loadingAnalysis}
                onClick={() => selectedCoin && fetchAnalysis(selectedCoin, profile)}
              >
                <Sparkles size={18} />
                <span>{loadingAnalysis ? "Analyzing" : "Analyze"}</span>
              </button>
            </div>

            <AssistantPanel analysis={analysis} />
          </section>
        </section>

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
          <ScenarioGrid scenarios={analysis?.scenarios || []} currency={currency} />
          <p className="disclaimer">
            Educational analysis only. Crypto is volatile, projections are possibilities rather than guarantees, and
            this is not financial advice.
          </p>
        </section>
      </main>
    </div>
  );
}

function AuthPage({ onAuth, theme, onToggleTheme }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const path = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body =
        mode === "signup"
          ? form
          : {
              email: form.email,
              password: form.password
            };
      const payload = await apiFetch(path, { method: "POST", body });
      onAuth(payload);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-visual">
        <AuthChartBackground />
        <div className="auth-brand">
          <div className="brand-mark">CA</div>
          <span>Crypto AI Market Analyst</span>
        </div>
        <div className="auth-copy">
          <p className="eyebrow">Private market workspace</p>
          <h1>Sign in before your crypto intelligence dashboard opens.</h1>
          <p>
            Your profile, theme, goals, and AI analysis history are saved to your own account in Postgres.
          </p>
        </div>
        <div className="auth-stats">
          <span><strong>Major</strong> BTC, ETH, SOL</span>
          <span><strong>Alt</strong> AI, DeFi, L2 assets</span>
          <span><strong>Meme</strong> DOGE, SHIB, PEPE</span>
        </div>
      </section>

      <section className="auth-panel" aria-labelledby="authHeading">
        <div className="auth-panel-top">
          <div>
            <p className="eyebrow">{mode === "signup" ? "Create account" : "Welcome back"}</p>
            <h2 id="authHeading">{mode === "signup" ? "Sign up" : "Login"}</h2>
          </div>
          <button className="icon-button ghost" type="button" onClick={onToggleTheme}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
        </div>

        <div className="auth-tabs">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            <LogIn size={16} />
            Login
          </button>
          <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
            <UserPlus size={16} />
            Sign up
          </button>
        </div>

        {error && (
          <div className="alert-strip compact" role="alert">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={submit}>
          {mode === "signup" && (
            <label>
              <span>Full name</span>
              <div className="input-with-icon">
                <User size={18} />
                <input
                  value={form.full_name}
                  onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
                  placeholder="Bilal Siddiqui"
                  autoComplete="name"
                  required
                />
              </div>
            </label>
          )}
          <label>
            <span>Email</span>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
          </label>
          <label>
            <span>Password</span>
            <div className="input-with-icon">
              <KeyRound size={18} />
              <input
                type="password"
                minLength={8}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Minimum 8 characters"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
              />
            </div>
          </label>
          <button className="auth-submit" type="submit" disabled={submitting}>
            {mode === "signup" ? <UserPlus size={18} /> : <LogIn size={18} />}
            <span>{submitting ? "Working..." : mode === "signup" ? "Create account" : "Login"}</span>
          </button>
        </form>
      </section>
    </main>
  );
}

function AuthChartBackground() {
  return (
    <div className="auth-chart-bg" aria-hidden="true">
      <svg viewBox="0 0 920 520" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartLineGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="var(--teal)" />
            <stop offset="55%" stopColor="var(--blue)" />
            <stop offset="100%" stopColor="var(--amber)" />
          </linearGradient>
          <linearGradient id="chartFillGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--teal)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="chart-grid">
          {Array.from({ length: 7 }).map((_, index) => (
            <line key={`h-${index}`} x1="0" x2="920" y1={60 + index * 64} y2={60 + index * 64} />
          ))}
          {Array.from({ length: 9 }).map((_, index) => (
            <line key={`v-${index}`} y1="0" y2="520" x1={80 + index * 96} x2={80 + index * 96} />
          ))}
        </g>
        <path
          className="chart-fill"
          d="M0 390 C80 360 120 338 190 345 C255 352 276 245 340 252 C416 260 424 188 492 198 C568 210 590 135 664 146 C740 158 776 92 920 118 L920 520 L0 520 Z"
        />
        <path
          className="chart-line"
          d="M0 390 C80 360 120 338 190 345 C255 352 276 245 340 252 C416 260 424 188 492 198 C568 210 590 135 664 146 C740 158 776 92 920 118"
        />
        <g className="chart-bars">
          <rect x="92" y="360" width="28" height="100" rx="5" />
          <rect x="154" y="326" width="28" height="134" rx="5" />
          <rect x="216" y="376" width="28" height="84" rx="5" />
          <rect x="278" y="290" width="28" height="170" rx="5" />
          <rect x="340" y="250" width="28" height="210" rx="5" />
          <rect x="402" y="306" width="28" height="154" rx="5" />
          <rect x="464" y="220" width="28" height="240" rx="5" />
        </g>
      </svg>
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="auth-shell loading-shell">
      <div className="brand-mark">CA</div>
      <strong>Loading your secure workspace...</strong>
    </main>
  );
}

function NavButton({ icon: Icon, label, target, active = false }) {
  return (
    <button
      className={`rail-button ${active ? "active" : ""}`}
      type="button"
      onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" })}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}

function MetricTile({ icon: Icon, label, value, detail }) {
  return (
    <article className="metric-tile">
      <Icon size={18} />
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function CoinCard({ coin, currency, active, onClick }) {
  return (
    <button className={`coin-card ${active ? "active" : ""}`} type="button" onClick={onClick}>
      <span className="coin-card-top">
        <span className="coin-identity">
          <CoinImage coin={coin} />
          <span>
            <strong className="coin-name">{coin.name}</strong>
            <small className="coin-symbol">{coin.symbol}</small>
          </span>
        </span>
        <span className={`category-chip ${coin.category}`}>{coin.category || "asset"}</span>
      </span>
      <span className="coin-price">{formatCurrency(coin.current_price, currency)}</span>
      <span className="coin-details">
        <ChangeBadge value={coin.price_change_percentage_24h} />
        <span className="coin-range">
          #{coin.market_cap_rank || "--"} · {formatCurrency(coin.low_24h, currency)} - {formatCurrency(coin.high_24h, currency)}
        </span>
      </span>
      <span className="sparkline" aria-hidden="true">
        <Sparkline points={coin.sparkline} positive={coin.price_change_percentage_24h >= 0} />
      </span>
    </button>
  );
}

function AssetStrip({ coin, currency }) {
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

function RangeMeter({ coin, currency }) {
  const position = clamp((coin.current_price - coin.low_24h) / Math.max(coin.high_24h - coin.low_24h, 0.0001), 0, 1);
  return (
    <div className="range-meter" aria-label="24 hour price range">
      <div className="range-meter-labels">
        <span>Low: {formatCurrency(coin.low_24h, currency)}</span>
        <strong>24h Low / High</strong>
        <span>High: {formatCurrency(coin.high_24h, currency)}</span>
      </div>
      <div className="range-track">
        <span className="range-fill" style={{ width: `${position * 100}%` }} />
        <span className="range-marker" style={{ left: `${position * 100}%` }} />
      </div>
    </div>
  );
}

function AssistantPanel({ analysis }) {
  if (!analysis) {
    return (
      <div className="assistant-score">
        <div className="score-ring">
          <span>--</span>
          <small>score</small>
        </div>
        <div>
          <strong>Waiting for market data</strong>
          <p>Once prices load, the backend combines momentum, 24h range position, volatility, and your saved investment profile.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="assistant-score">
        <div
          className="score-ring"
          style={{
            background: `radial-gradient(circle at center, var(--panel) 56%, transparent 57%), conic-gradient(${analysis.color} 0deg, ${analysis.color} ${
              analysis.score * 3.6
            }deg, var(--line) ${analysis.score * 3.6}deg)`
          }}
        >
          <span>{analysis.score}</span>
          <small>score</small>
        </div>
        <div>
          <strong>{analysis.signal}</strong>
          <p>{analysis.summary}</p>
          <small className="ai-source">Source: {analysis.ai_source === "openai" ? `OpenAI · ${analysis.model}` : "Rule-based fallback"}</small>
        </div>
      </div>
      <div className="insight-list">
        {analysis.insights.map((insight) => (
          <article className="insight-item" key={insight.title}>
            <span className="insight-icon">{insight.icon}</span>
            <span>
              <strong>{insight.title}</strong>
              <p>{insight.body}</p>
            </span>
          </article>
        ))}
      </div>
    </>
  );
}

function ScenarioGrid({ scenarios, currency }) {
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

function Field({ label, children }) {
  return (
    <label>
      <span>{label}</span>
      {children}
    </label>
  );
}

function CoinImage({ coin, large = false }) {
  return (
    <img
      className={large ? "coin-image large" : "coin-image"}
      src={coin.image || makeCoinIcon(coin.symbol)}
      alt={`${coin.name} logo`}
    />
  );
}

function ChangeBadge({ value }) {
  const className = value > 0.05 ? "positive" : value < -0.05 ? "negative" : "neutral";
  return <span className={`change-badge ${className}`}>{formatPercent(value)}</span>;
}

function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <Target size={20} />
      <span>{text}</span>
    </div>
  );
}

function PriceChart({ coin, range, currency }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    drawPriceChart(canvasRef.current, expandSeriesForRange(coin, range), coin, range, currency);
  }, [coin, range, currency]);

  return <canvas ref={canvasRef} aria-label={`${coin.name} price chart`} />;
}

function Sparkline({ points, positive }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !points?.length) return;
    drawSparkline(canvasRef.current, points, positive);
  }, [points, positive]);

  return <canvas ref={canvasRef} width="220" height="52" />;
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const error = new Error(payload?.detail || `Request failed with ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return payload;
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem("crypto-ai-session") || "null");
  } catch {
    return null;
  }
}

function persistSession(session) {
  localStorage.setItem("crypto-ai-session", JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem("crypto-ai-session");
}

function buildSummary(coins) {
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

function expandSeriesForRange(coin, range) {
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

function drawPriceChart(canvas, points, coin, range, currency) {
  const context = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(600, Math.floor(rect.width * ratio));
  canvas.height = Math.max(280, Math.floor(rect.height * ratio));
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, rect.width, rect.height);

  const color = coin.price_change_percentage_24h >= 0 ? "#0f766e" : "#c65d44";
  drawLine(context, points, {
    width: rect.width,
    height: rect.height,
    padding: 38,
    lineWidth: 3,
    stroke: color,
    fill: coin.price_change_percentage_24h >= 0 ? "rgba(15, 118, 110, 0.14)" : "rgba(198, 93, 68, 0.14)",
    grid: true
  });

  const min = Math.min(...points);
  const max = Math.max(...points);
  context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--muted") || "#66706d";
  context.font = "700 12px Inter, system-ui, sans-serif";
  context.fillText(`Range ${range}D`, 38, 24);
  context.fillText(`High ${formatCurrency(max, currency)}`, Math.max(38, rect.width - 180), 24);
  context.fillText(`Low ${formatCurrency(min, currency)}`, Math.max(38, rect.width - 180), rect.height - 18);
  context.fillStyle = color;
  context.fillText(`${coin.symbol} ${formatPercent(coin.price_change_percentage_24h)} 24h`, 38, rect.height - 18);
}

function drawSparkline(canvas, points, positive) {
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawLine(context, points, {
    width: canvas.width,
    height: canvas.height,
    padding: 5,
    lineWidth: 3,
    stroke: positive ? "#0f766e" : "#c65d44",
    fill: positive ? "rgba(15, 118, 110, 0.12)" : "rgba(198, 93, 68, 0.12)",
    grid: false
  });
}

function drawLine(context, points, options) {
  if (!points.length) return;

  const { width, height, padding, lineWidth, stroke, fill, grid } = options;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const spread = Math.max(max - min, 0.0001);
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  if (grid) {
    context.strokeStyle = "rgba(102, 112, 109, 0.14)";
    context.lineWidth = 1;
    for (let index = 0; index <= 4; index += 1) {
      const y = padding + (innerHeight / 4) * index;
      context.beginPath();
      context.moveTo(padding, y);
      context.lineTo(width - padding, y);
      context.stroke();
    }
  }

  const coords = points.map((point, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * innerWidth;
    const y = padding + (1 - (point - min) / spread) * innerHeight;
    return [x, y];
  });

  context.beginPath();
  coords.forEach(([x, y], index) => {
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.strokeStyle = stroke;
  context.lineWidth = lineWidth;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.stroke();

  context.lineTo(width - padding, height - padding);
  context.lineTo(padding, height - padding);
  context.closePath();
  context.fillStyle = fill;
  context.fill();

  const last = coords.at(-1);
  if (last) {
    context.beginPath();
    context.arc(last[0], last[1], 5, 0, Math.PI * 2);
    context.fillStyle = stroke;
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = "#ffffff";
    context.stroke();
  }
}

function makeSparkline(price, change, seed) {
  const start = price / Math.max(0.1, 1 + change / 100);
  return Array.from({ length: 168 }, (_, index) => {
    const progress = index / 167;
    const wave = Math.sin(index / (8 + seed)) * 0.014 + Math.cos(index / (15 + seed)) * 0.01;
    const drift = (price - start) * progress;
    return Math.max(0.0001, start + drift + price * wave);
  });
}

function formatCurrency(value, currency) {
  const symbol = currencySymbols[currency] || "$";
  const abs = Math.abs(value);
  const decimals = abs >= 1000 ? 0 : abs >= 1 ? 2 : 4;
  return `${symbol}${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
}

function formatPercent(value) {
  const numeric = Number(value || 0);
  return `${numeric > 0 ? "+" : ""}${numeric.toFixed(2)}%`;
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function rangeVolatility(coin) {
  return ((coin.high_24h - coin.low_24h) / Math.max(coin.current_price, 0.0001)) * 100;
}

function average(values) {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 0;
}

function makeCoinIcon(symbol) {
  const text = encodeURIComponent(String(symbol || "?").slice(0, 3));
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='40' fill='%23dceafd'/%3E%3Ctext x='40' y='47' text-anchor='middle' font-family='Arial,sans-serif' font-size='22' font-weight='800' fill='%232f6fbd'%3E${text}%3C/text%3E%3C/svg%3E`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
