import { apiFetch } from "./client";

export function requestAnalysis(token, currency, coin, profile) {
  return apiFetch("/api/analyze", {
    token,
    method: "POST",
    body: {
      currency,
      coin,
      profile: { ...profile, currency }
    }
  });
}
