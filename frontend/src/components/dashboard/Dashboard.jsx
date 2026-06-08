import { AlertStrip } from "../common/AlertStrip";
import { AssistantPanel } from "./AssistantPanel";
import { ChartPanel } from "./ChartPanel";
import { ForecastPanel } from "./ForecastPanel";
import { MarketPanel } from "./MarketPanel";
import { ProfilePanel } from "./ProfilePanel";
import { Rail } from "./Rail";
import { SummaryGrid } from "./SummaryGrid";
import { Topbar } from "./Topbar";

export function Dashboard({
  session,
  theme,
  market,
  currency,
  autoRefresh,
  loadingMarket,
  error,
  summary,
  coins,
  visibleCoins,
  visibleCoinCount,
  selectedCoin,
  profile,
  profileStatus,
  analysis,
  loadingAnalysis,
  onCurrencyChange,
  onAutoRefreshChange,
  onToggleTheme,
  onRefreshMarket,
  onLogout,
  onSelectCoin,
  onLoadMoreCoins,
  onProfileChange,
  onSaveProfile,
  onAnalyze
}) {
  return (
    <div className="app-shell">
      <Rail />

      <main className="workspace">
        <Topbar
          session={session}
          market={market}
          currency={currency}
          autoRefresh={autoRefresh}
          theme={theme}
          loadingMarket={loadingMarket}
          onCurrencyChange={onCurrencyChange}
          onAutoRefreshChange={onAutoRefreshChange}
          onToggleTheme={onToggleTheme}
          onRefresh={onRefreshMarket}
          onLogout={onLogout}
        />

        <AlertStrip>{error}</AlertStrip>
        <SummaryGrid summary={summary} />

        <section className="dashboard-grid" id="market">
          <MarketPanel
            market={market}
            coins={coins}
            visibleCoins={visibleCoins}
            selectedCoin={selectedCoin}
            currency={currency}
            visibleCoinCount={visibleCoinCount}
            onSelectCoin={onSelectCoin}
            onLoadMore={onLoadMoreCoins}
          />
          <ChartPanel selectedCoin={selectedCoin} currency={currency} />
        </section>

        <section className="lower-grid">
          <ProfilePanel
            profile={profile}
            coins={coins}
            profileStatus={profileStatus}
            onProfileChange={onProfileChange}
            onSaveProfile={onSaveProfile}
          />
          <AssistantPanel
            analysis={analysis}
            loadingAnalysis={loadingAnalysis}
            selectedCoin={selectedCoin}
            onAnalyze={onAnalyze}
          />
        </section>

        <ForecastPanel scenarios={analysis?.scenarios || []} currency={currency} />
      </main>
    </div>
  );
}
