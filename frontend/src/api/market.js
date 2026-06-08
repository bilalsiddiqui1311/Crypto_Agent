import { apiFetch } from "./client";

export function fetchMarketSnapshot(currency) {
  return apiFetch(`/api/market?currency=${currency}`);
}
