from __future__ import annotations

from math import sqrt

from app.config import settings
from app.schemas import (
    AnalysisResponse,
    Coin,
    Insight,
    InvestmentProfile,
    RiskProfile,
    ScenarioGroup,
    ScenarioRow,
)
from app.services.openai_service import maybe_openai_analysis


async def build_analysis(coin: Coin, profile: InvestmentProfile) -> AnalysisResponse:
    base = build_rule_analysis(coin, profile)
    openai_payload = await maybe_openai_analysis(coin, profile, base)
    if not openai_payload:
        return base

    insights = [
        Insight(
            icon=str(item.get("icon", "A"))[:2].upper(),
            title=str(item.get("title", "AI insight"))[:80],
            body=str(item.get("body", ""))[:420],
        )
        for item in openai_payload.get("insights", [])
        if isinstance(item, dict)
    ][:4]

    if len(insights) < 3:
        insights = base.insights

    return AnalysisResponse(
        score=base.score,
        signal=str(openai_payload.get("signal") or base.signal)[:160],
        summary=str(openai_payload.get("summary") or base.summary)[:640],
        color=base.color,
        allocation=base.allocation,
        insights=insights,
        scenarios=base.scenarios,
        ai_source="openai",
        model=settings.openai_model,
    )


def build_rule_analysis(coin: Coin, profile: InvestmentProfile) -> AnalysisResponse:
    range_position = clamp((coin.current_price - coin.low_24h) / max(coin.high_24h - coin.low_24h, 0.0001), 0, 1)
    momentum = weighted_momentum(coin)
    volatility = range_volatility(coin)
    risk_penalty = {"conservative": 2.2, "balanced": 1.25, "aggressive": 0.65}[profile.risk_profile] * volatility
    chase_penalty = 9 if range_position > 0.82 else 5 if range_position > 0.7 else 0
    meme_penalty = 8 if coin.category == "meme" and profile.risk_profile == "conservative" else 0
    deep_discount_boost = 7 if range_position < 0.28 and momentum > -5 else 0
    score = round(clamp(54 + momentum * 1.35 + deep_discount_boost - risk_penalty - chase_penalty - meme_penalty, 8, 94))
    score_band = "Constructive" if score >= 70 else "Watch carefully" if score >= 48 else "Defensive"
    color = "#0f766e" if score >= 70 else "#a86d18" if score >= 48 else "#c65d44"
    allocation = build_allocation(profile.risk_profile)

    summary = (
        f"{score_band} setup for {coin.symbol}: {describe_momentum(momentum)}, price is "
        f"{round(range_position * 100)}% through today's low-high range, and risk heat is "
        f"{'elevated' if volatility > 7 else 'moderate' if volatility > 3.5 else 'contained'}."
    )

    insights = [
        Insight(
            icon="M",
            title="Market read",
            body=(
                f"{coin.name} has {format_percent(coin.price_change_percentage_24h)} 24h momentum and "
                f"{format_percent(coin.price_change_percentage_7d)} over 7 days. "
                + (
                    "It is close to today's high, so avoid emotional chasing."
                    if range_position > 0.78
                    else "It is not stretched against today's high."
                )
            ),
        ),
        Insight(
            icon="P",
            title="Profile fit",
            body=(
                f"{profile.risk_profile.title()} risk points to roughly {allocation['core']}% core large-cap crypto, "
                f"{allocation['growth']}% growth assets, and {allocation['cash']}% cash or stablecoin buffer."
            ),
        ),
        Insight(
            icon="S",
            title="Suggested action",
            body=f"{style_advice(profile, range_position)} Your total planned exposure is {profile.investment_amount + profile.holding_amount:,.2f} before future monthly contributions.",
        ),
        Insight(
            icon="G",
            title="Goal check",
            body=(
                f'Your note says: "{profile.investor_goal[:140]}{"..." if len(profile.investor_goal) > 140 else ""}" The plan should prioritize that constraint.'
                if profile.investor_goal.strip()
                else "Add a goal or concern to make the suggestion more specific to your investment situation."
            ),
        ),
    ]

    signal_action = "accumulate on pullbacks" if score >= 70 else "wait for confirmation" if score >= 48 else "protect capital"
    return AnalysisResponse(
        score=score,
        signal=f"{score_band}: {signal_action}",
        summary=summary,
        color=color,
        allocation=allocation,
        insights=insights,
        scenarios=build_scenarios(coin, profile, momentum, volatility),
    )


def build_allocation(risk: RiskProfile) -> dict[str, int]:
    if risk == "conservative":
        return {"core": 60, "growth": 15, "meme": 0, "cash": 25}
    if risk == "aggressive":
        return {"core": 40, "growth": 35, "meme": 10, "cash": 15}
    return {"core": 52, "growth": 23, "meme": 5, "cash": 20}


def style_advice(profile: InvestmentProfile, range_position: float) -> str:
    if profile.strategy_style == "dca":
        tranche_count = "3 to 5" if profile.risk_profile == "aggressive" else "5 to 8"
        return f"Split entries into {tranche_count} tranches instead of trying to catch one perfect price."
    if profile.strategy_style == "lump":
        if range_position > 0.72:
            return "A full lump-sum entry is less attractive while price sits near the upper 24h range."
        return "If using lump sum, reserve a cash buffer in case volatility expands after entry."
    return "Use this signal to trim overheated assets and add to stronger positions on pullbacks."


def build_scenarios(coin: Coin, profile: InvestmentProfile, momentum: float, volatility_percent: float) -> list[ScenarioGroup]:
    horizons = [("1 Month", 1), ("3 Months", 3), ("1 Year", 12)]
    return [build_scenario_group(label, months, coin, profile, momentum, volatility_percent) for label, months in horizons]


def build_scenario_group(
    label: str,
    months: int,
    coin: Coin,
    profile: InvestmentProfile,
    momentum: float,
    volatility_percent: float,
) -> ScenarioGroup:
    risk_multiplier = {"conservative": 0.78, "balanced": 1, "aggressive": 1.18}[profile.risk_profile]
    category_multiplier = 1.16 if coin.category == "meme" else 1
    momentum_base = clamp(momentum / 100, -0.22, 0.32)
    volatility = clamp((volatility_percent / 100) * category_multiplier, 0.015, 0.24)
    time_scale = sqrt(months)
    base_move = clamp(momentum_base * months * 0.72 * risk_multiplier, -0.42, 0.78)
    bear_move = clamp(base_move - volatility * 1.8 * time_scale - 0.03 * months, -0.78, 0.55)
    bull_move = clamp(base_move + volatility * 2.1 * time_scale + 0.035 * months, -0.25, 1.65)

    moves = [
        ("Bear", "bear", bear_move, 25),
        ("Base", "base", base_move, 50),
        ("Bull", "bull", bull_move, 25),
    ]
    rows = [
        ScenarioRow(
            label=scenario_label,
            kind=kind,
            price=coin.current_price * (1 + move),
            move_percent=move * 100,
            probability_hint=probability_hint,
        )
        for scenario_label, kind, move, probability_hint in moves
    ]
    total_input = profile.investment_amount + profile.holding_amount + profile.monthly_contribution * months
    return ScenarioGroup(
        horizon=label,
        months=months,
        rows=rows,
        base_portfolio_value=total_input * (1 + base_move),
    )


def weighted_momentum(coin: Coin) -> float:
    return (
        coin.price_change_percentage_1h * 0.8
        + coin.price_change_percentage_24h * 0.45
        + coin.price_change_percentage_7d * 0.27
        + coin.price_change_percentage_30d * 0.12
    )


def describe_momentum(momentum: float) -> str:
    if momentum > 8:
        return "strong upside momentum"
    if momentum > 2:
        return "positive but controlled momentum"
    if momentum > -2:
        return "flat momentum"
    if momentum > -8:
        return "soft momentum"
    return "heavy downside momentum"


def range_volatility(coin: Coin) -> float:
    return ((coin.high_24h - coin.low_24h) / max(coin.current_price, 0.0001)) * 100


def format_percent(value: float) -> str:
    sign = "+" if value > 0 else ""
    return f"{sign}{value:.2f}%"


def clamp(value: float, minimum: float, maximum: float) -> float:
    return min(max(value, minimum), maximum)
