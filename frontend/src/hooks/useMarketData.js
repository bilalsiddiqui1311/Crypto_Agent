import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchMarketSnapshot } from "../api/market";
import { COINS_PER_LOAD, INITIAL_VISIBLE_COINS } from "../constants/market";
import { useLatest } from "./useLatest";

export function useMarketData({ enabled, currency, selectedId, autoRefresh, onMarketLoaded, onError }) {
  const [market, setMarket] = useState(null);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [visibleCoinCount, setVisibleCoinCount] = useState(INITIAL_VISIBLE_COINS);
  const selectedIdRef = useLatest(selectedId);
  const onMarketLoadedRef = useLatest(onMarketLoaded);
  const onErrorRef = useLatest(onError);

  const coins = market?.coins || [];
  const visibleCoins = coins.slice(0, visibleCoinCount);
  const selectedCoin = useMemo(
    () => coins.find((coin) => coin.id === selectedId) || coins[0],
    [coins, selectedId]
  );

  const fetchMarket = useCallback(async () => {
    if (!enabled) return;

    setLoadingMarket(true);
    try {
      const payload = await fetchMarketSnapshot(currency);
      setMarket(payload);
      onMarketLoadedRef.current?.(payload, selectedIdRef.current);
    } catch (requestError) {
      onErrorRef.current?.(`Backend unavailable: ${requestError.message}`);
    } finally {
      setLoadingMarket(false);
    }
  }, [currency, enabled, onErrorRef, onMarketLoadedRef, selectedIdRef]);

  useEffect(() => {
    if (!enabled) return;
    setVisibleCoinCount(INITIAL_VISIBLE_COINS);
    fetchMarket();
  }, [currency, enabled, fetchMarket]);

  useEffect(() => {
    if (!enabled || !autoRefresh) return undefined;
    const interval = window.setInterval(fetchMarket, 60_000);
    return () => window.clearInterval(interval);
  }, [autoRefresh, enabled, fetchMarket]);

  const loadMoreCoins = useCallback(() => {
    setVisibleCoinCount((count) => Math.min(count + COINS_PER_LOAD, coins.length));
  }, [coins.length]);

  const resetMarket = useCallback(() => {
    setMarket(null);
    setVisibleCoinCount(INITIAL_VISIBLE_COINS);
    setLoadingMarket(false);
  }, []);

  return {
    market,
    coins,
    visibleCoins,
    selectedCoin,
    loadingMarket,
    visibleCoinCount,
    loadMoreCoins,
    resetMarket,
    refreshMarket: fetchMarket
  };
}
