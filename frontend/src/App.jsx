import { useCallback, useEffect, useMemo, useState } from "react";

import { AuthPage } from "./components/auth/AuthPage";
import { LoadingScreen } from "./components/common/LoadingScreen";
import { Dashboard } from "./components/dashboard/Dashboard";
import { useAnalysis } from "./hooks/useAnalysis";
import { useAuthSession } from "./hooks/useAuthSession";
import { useInvestmentProfile } from "./hooks/useInvestmentProfile";
import { useMarketData } from "./hooks/useMarketData";
import { useTheme } from "./hooks/useTheme";
import { buildSummary } from "./utils/market";

export default function App() {
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { session, booting, token, acceptSession, updateSession, logout } = useAuthSession();
  const { theme, setTheme, toggleTheme } = useTheme();
  const {
    profile,
    setProfile,
    currency,
    selectedId,
    setSelectedId,
    profileStatus,
    hydrateProfile,
    resetProfile,
    updateProfile,
    changeCurrency,
    saveProfile
  } = useInvestmentProfile({ onError: setError });

  useEffect(() => {
    if (!session) return;
    hydrateProfile(session.profile);
    setTheme(session.user.theme || "light");
  }, [hydrateProfile, session, setTheme]);

  const handleMarketLoaded = useCallback(
    (payload, currentSelectedId) => {
      setError("");
      if (!payload.coins.some((coin) => coin.id === currentSelectedId)) {
        setSelectedId(payload.coins[0]?.id || "bitcoin");
      }
      if (!profile.holding_coin && payload.coins[0]?.id) {
        setProfile((current) => ({ ...current, holding_coin: payload.coins[0].id }));
      }
    },
    [profile.holding_coin, setProfile, setSelectedId]
  );

  const marketData = useMarketData({
    enabled: Boolean(session),
    currency,
    selectedId,
    autoRefresh,
    onMarketLoaded: handleMarketLoaded,
    onError: setError
  });

  const handleUnauthorized = useCallback(() => {
    logout();
    marketData.resetMarket();
    resetProfile();
  }, [logout, marketData, resetProfile]);

  const analysisData = useAnalysis({
    enabled: Boolean(session),
    token,
    currency,
    selectedCoin: marketData.selectedCoin,
    profile,
    onUnauthorized: handleUnauthorized,
    onError: setError,
    onSuccess: () => setError("")
  });

  const summary = useMemo(() => buildSummary(marketData.coins), [marketData.coins]);

  const handleAuth = useCallback(
    (nextSession) => {
      acceptSession(nextSession);
      hydrateProfile(nextSession.profile);
      setTheme(nextSession.user.theme || "light");
      setError("");
    },
    [acceptSession, hydrateProfile, setTheme]
  );

  const handleLogout = useCallback(() => {
    logout();
    marketData.resetMarket();
    analysisData.resetAnalysis();
    resetProfile();
    setError("");
  }, [analysisData, logout, marketData, resetProfile]);

  const handleThemeToggle = useCallback(() => {
    toggleTheme({ token, session, updateSession });
  }, [session, toggleTheme, token, updateSession]);

  const handleSelectCoin = useCallback(
    (coin) => {
      setSelectedId(coin.id);
      updateProfile("holding_coin", coin.id);
    },
    [setSelectedId, updateProfile]
  );

  const handleSaveProfile = useCallback(() => {
    saveProfile({ token, session, updateSession });
  }, [saveProfile, session, token, updateSession]);

  const handleAnalyze = useCallback(() => {
    if (marketData.selectedCoin) {
      analysisData.runAnalysis(marketData.selectedCoin, profile);
    }
  }, [analysisData, marketData.selectedCoin, profile]);

  if (booting) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <AuthPage onAuth={handleAuth} theme={theme} onToggleTheme={handleThemeToggle} />;
  }

  return (
    <Dashboard
      session={session}
      theme={theme}
      market={marketData.market}
      currency={currency}
      autoRefresh={autoRefresh}
      loadingMarket={marketData.loadingMarket}
      error={error}
      summary={summary}
      coins={marketData.coins}
      visibleCoins={marketData.visibleCoins}
      visibleCoinCount={marketData.visibleCoinCount}
      selectedCoin={marketData.selectedCoin}
      profile={profile}
      profileStatus={profileStatus}
      analysis={analysisData.analysis}
      loadingAnalysis={analysisData.loadingAnalysis}
      onCurrencyChange={changeCurrency}
      onAutoRefreshChange={setAutoRefresh}
      onToggleTheme={handleThemeToggle}
      onRefreshMarket={marketData.refreshMarket}
      onLogout={handleLogout}
      onSelectCoin={handleSelectCoin}
      onLoadMoreCoins={marketData.loadMoreCoins}
      onProfileChange={updateProfile}
      onSaveProfile={handleSaveProfile}
      onAnalyze={handleAnalyze}
    />
  );
}
