import { Sparkles } from "lucide-react";

export function AssistantPanel({ analysis, loadingAnalysis, selectedCoin, onAnalyze }) {
  return (
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
          onClick={onAnalyze}
        >
          <Sparkles size={18} />
          <span>{loadingAnalysis ? "Analyzing" : "Analyze"}</span>
        </button>
      </div>

      <AssistantContent analysis={analysis} />
    </section>
  );
}

function AssistantContent({ analysis }) {
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
