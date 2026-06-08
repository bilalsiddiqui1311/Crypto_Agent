import { useCallback, useEffect, useState } from "react";

import { requestAnalysis } from "../api/analysis";
import { useLatest } from "./useLatest";

export function useAnalysis({ enabled, token, currency, selectedCoin, profile, onUnauthorized, onError, onSuccess }) {
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const onUnauthorizedRef = useLatest(onUnauthorized);
  const onErrorRef = useLatest(onError);
  const onSuccessRef = useLatest(onSuccess);

  const runAnalysis = useCallback(
    async (coin = selectedCoin, nextProfile = profile) => {
      if (!enabled || !token || !coin) return;
      setLoadingAnalysis(true);

      try {
        const payload = await requestAnalysis(token, currency, coin, nextProfile);
        setAnalysis(payload);
        onSuccessRef.current?.();
      } catch (requestError) {
        if (requestError.status === 401) {
          onUnauthorizedRef.current?.();
          onErrorRef.current?.("Please log in again to continue.");
        } else {
          onErrorRef.current?.(`Analysis unavailable: ${requestError.message}`);
        }
      } finally {
        setLoadingAnalysis(false);
      }
    },
    [currency, enabled, onErrorRef, onSuccessRef, onUnauthorizedRef, profile, selectedCoin, token]
  );

  useEffect(() => {
    if (!enabled || !selectedCoin) return undefined;
    const timer = window.setTimeout(() => runAnalysis(selectedCoin, profile), 260);
    return () => window.clearTimeout(timer);
  }, [enabled, profile, runAnalysis, selectedCoin]);

  const resetAnalysis = useCallback(() => {
    setAnalysis(null);
    setLoadingAnalysis(false);
  }, []);

  return {
    analysis,
    loadingAnalysis,
    runAnalysis,
    resetAnalysis
  };
}
