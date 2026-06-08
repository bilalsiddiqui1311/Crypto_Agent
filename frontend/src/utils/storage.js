const SESSION_KEY = "crypto-ai-session";
const THEME_KEY = "crypto-ai-theme";

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function persistSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function loadTheme() {
  return localStorage.getItem(THEME_KEY);
}

export function persistTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}
