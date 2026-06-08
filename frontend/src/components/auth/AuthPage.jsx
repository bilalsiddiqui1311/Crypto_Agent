import { useState } from "react";
import { KeyRound, LogIn, Mail, Moon, Sun, User, UserPlus } from "lucide-react";

import { login, signup } from "../../api/auth";
import { AlertStrip } from "../common/AlertStrip";
import { AuthChartBackground } from "./AuthChartBackground";

export function AuthPage({ onAuth, theme, onToggleTheme }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = mode === "signup" ? await signup(form) : await login(form);
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

        <AlertStrip compact>{error}</AlertStrip>

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
