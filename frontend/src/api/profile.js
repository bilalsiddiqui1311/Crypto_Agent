import { apiFetch } from "./client";

export function updateInvestmentProfile(token, profile) {
  return apiFetch("/api/profile", {
    token,
    method: "PUT",
    body: profile
  });
}

export function saveThemePreference(token, theme) {
  return apiFetch("/api/theme", {
    token,
    method: "PUT",
    body: { theme }
  });
}
