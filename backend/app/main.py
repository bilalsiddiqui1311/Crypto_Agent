from __future__ import annotations

import json
import os
import re
from datetime import UTC, datetime, timedelta
from math import cos, sin, sqrt
from typing import Literal

import httpx
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import SessionLocal, get_db, init_db
from app.models import AnalysisRecord, User, UserProfile
from app.security import create_access_token, get_current_user, hash_password, verify_password


ASSET_UNIVERSE = [
    ("bitcoin", "major"),
    ("ethereum", "major"),
    ("tether", "stablecoin"),
    ("binancecoin", "major"),
    ("solana", "major"),
    ("usd-coin", "stablecoin"),
    ("ripple", "major"),
    ("dogecoin", "meme"),
    ("cardano", "major"),
    ("tron", "major"),
    ("chainlink", "altcoin"),
    ("avalanche-2", "altcoin"),
    ("stellar", "major"),
    ("sui", "altcoin"),
    ("shiba-inu", "meme"),
    ("toncoin", "major"),
    ("polkadot", "major"),
    ("bitcoin-cash", "major"),
    ("litecoin", "major"),
    ("uniswap", "defi"),
    ("near", "altcoin"),
    ("aptos", "altcoin"),
    ("internet-computer", "altcoin"),
    ("ethereum-classic", "major"),
    ("polygon-ecosystem-token", "altcoin"),
    ("cosmos", "altcoin"),
    ("optimism", "layer2"),
    ("arbitrum", "layer2"),
    ("render-token", "ai"),
    ("filecoin", "altcoin"),
    ("injective-protocol", "defi"),
    ("immutable-x", "gaming"),
    ("the-graph", "ai"),
    ("aave", "defi"),
    ("maker", "defi"),
    ("gala", "gaming"),
    ("pepe", "meme"),
    ("pump-fun", "meme"),
    ("official-trump", "meme"),
    ("dogwifcoin", "meme"),
    ("bonk", "meme"),
    ("floki", "meme"),
    ("fartcoin", "meme"),
    ("brett", "meme"),
    ("popcat", "meme"),
    ("mog-coin", "meme"),
]

ASSET_CATEGORY = dict(ASSET_UNIVERSE)
COINS = [coin_id for coin_id, _category in ASSET_UNIVERSE]

COIN_FALLBACKS = [
    ("bitcoin", "Bitcoin", "BTC", 68240, 66180, 69450, 2.4, 5.8, 12.5, 1, "major"),
    ("ethereum", "Ethereum", "ETH", 3560, 3440, 3658, 1.7, 4.9, 8.1, 2, "major"),
    ("solana", "Solana", "SOL", 154.22, 147.1, 160.35, -1.2, 6.8, 17.2, 5, "major"),
    ("binancecoin", "BNB", "BNB", 612.4, 596.2, 621.7, 0.8, 1.9, 5.2, 4, "major"),
    ("ripple", "XRP", "XRP", 0.61, 0.58, 0.63, -0.7, 2.1, 4.6, 7, "major"),
    ("dogecoin", "Dogecoin", "DOGE", 0.16, 0.15, 0.17, -2.4, 3.7, 10.2, 8, "meme"),
    ("cardano", "Cardano", "ADA", 0.47, 0.45, 0.49, 1.1, 2.8, 7.4, 9, "major"),
    ("avalanche-2", "Avalanche", "AVAX", 34.8, 33.1, 36.4, 2.9, 7.9, 13.6, 11, "altcoin"),
    ("chainlink", "Chainlink", "LINK", 17.25, 16.55, 17.8, 1.4, 3.4, 9.6, 14, "altcoin"),
    ("polkadot", "Polkadot", "DOT", 7.14, 6.88, 7.41, -0.4, 1.7, 6.8, 15, "major"),
    ("pepe", "Pepe", "PEPE", 0.000011, 0.000010, 0.000012, 4.2, 11.3, 28.5, 32, "meme"),
    ("pump-fun", "Pump.fun", "PUMP", 0.0058, 0.0052, 0.0062, 3.6, 8.7, 18.2, 95, "meme"),
    ("gala", "GALA", "GALA", 0.032, 0.030, 0.034, 1.8, 4.4, 11.5, 84, "gaming"),
    ("shiba-inu", "Shiba Inu", "SHIB", 0.000023, 0.000021, 0.000024, 1.9, 6.4, 14.9, 18, "meme"),
    ("dogwifcoin", "dogwifhat", "WIF", 2.14, 1.95, 2.31, -3.5, 9.6, 21.1, 44, "meme"),
    ("bonk", "Bonk", "BONK", 0.000028, 0.000026, 0.000030, 2.8, 7.7, 19.8, 52, "meme"),
]

CURRENCY_MULTIPLIERS = {
    "usd": 1,
    "eur": 0.92,
    "gbp": 0.78,
    "pkr": 278,
    "inr": 83.4,
}

Currency = Literal["usd", "eur", "gbp", "pkr", "inr"]
RiskProfile = Literal["conservative", "balanced", "aggressive"]
StrategyStyle = Literal["dca", "lump", "rebalance"]
Theme = Literal["light", "dark"]


class Coin(BaseModel):
    id: str
    name: str
    symbol: str
    category: str = "asset"
    image: str = ""
    current_price: float
    high_24h: float
    low_24h: float
    price_change_percentage_1h: float = 0
    price_change_percentage_24h: float = 0
    price_change_percentage_7d: float = 0
    price_change_percentage_30d: float = 0
    market_cap: float = 0
    total_volume: float = 0
    market_cap_rank: int | None = None
    sparkline: list[float] = Field(default_factory=list)


class MarketResponse(BaseModel):
    currency: Currency
    source: Literal["live", "fallback"]
    updated_at: datetime
    coins: list[Coin]


class InvestmentProfile(BaseModel):
    investment_amount: float = Field(default=1000, ge=0)
    monthly_contribution: float = Field(default=150, ge=0)
    holding_coin: str = "bitcoin"
    holding_amount: float = Field(default=0, ge=0)
    risk_profile: RiskProfile = "balanced"
    strategy_style: StrategyStyle = "dca"
    investor_goal: str = ""


class ProfileResponse(InvestmentProfile):
    currency: Currency = "usd"
    updated_at: datetime | None = None


class ProfileUpdate(InvestmentProfile):
    currency: Currency = "usd"


class AnalysisRequest(BaseModel):
    currency: Currency = "usd"
    coin: Coin
    profile: InvestmentProfile


class Insight(BaseModel):
    icon: str
    title: str
    body: str


class ScenarioRow(BaseModel):
    label: Literal["Bear", "Base", "Bull"]
    kind: Literal["bear", "base", "bull"]
    price: float
    move_percent: float
    probability_hint: int


class ScenarioGroup(BaseModel):
    horizon: str
    months: int
    rows: list[ScenarioRow]
    base_portfolio_value: float


class AnalysisResponse(BaseModel):
    score: int
    signal: str
    summary: str
    color: str
    allocation: dict[str, int]
    insights: list[Insight]
    scenarios: list[ScenarioGroup]
    ai_source: Literal["openai", "rule_based"] = "rule_based"
    model: str = "rule-engine"


class SignupRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class ThemeUpdate(BaseModel):
    theme: Theme


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    theme: Theme


class AuthResponse(BaseModel):
    token: str
    user: UserOut
    profile: ProfileResponse


class SessionResponse(BaseModel):
    user: UserOut
    profile: ProfileResponse


app = FastAPI(title="Crypto AI Market Analyst API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_market_cache: dict[str, MarketResponse] = {}
_cache_ttl = timedelta(seconds=45)


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/api/health")
async def health() -> dict[str, str]:
    with SessionLocal() as db:
        db.execute(text("SELECT 1"))
    return {"status": "ok", "service": "crypto-ai-market-api", "database": "ok"}


@app.post("/api/auth/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> AuthResponse:
    email = normalize_email(payload.email)
    existing = db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")

    user = User(email=email, full_name=payload.full_name.strip(), password_hash=hash_password(payload.password))
    user.profile = UserProfile()
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists") from exc

    db.refresh(user)
    return AuthResponse(token=create_access_token(user), user=serialize_user(user), profile=serialize_profile(user.profile))


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    email = normalize_email(payload.email)
    user = db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    profile = ensure_profile(db, user)
    return AuthResponse(token=create_access_token(user), user=serialize_user(user), profile=serialize_profile(profile))


@app.get("/api/auth/me", response_model=SessionResponse)
async def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> SessionResponse:
    profile = ensure_profile(db, current_user)
    return SessionResponse(user=serialize_user(current_user), profile=serialize_profile(profile))


@app.put("/api/profile", response_model=ProfileResponse)
async def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    profile = upsert_profile(db, current_user, payload)
    db.commit()
    db.refresh(profile)
    return serialize_profile(profile)


@app.put("/api/theme", response_model=UserOut)
async def update_theme(
    payload: ThemeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    current_user.theme = payload.theme
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return serialize_user(current_user)


@app.get("/api/market", response_model=MarketResponse)
async def get_market(currency: Currency = "usd") -> MarketResponse:
    cached = _market_cache.get(currency)
    now = datetime.now(UTC)
    if cached and now - cached.updated_at < _cache_ttl:
        return cached

    try:
        coins = await fetch_live_market(currency)
        response = MarketResponse(currency=currency, source="live", updated_at=now, coins=coins)
    except Exception:
        response = MarketResponse(currency=currency, source="fallback", updated_at=now, coins=build_fallback_market(currency))

    _market_cache[currency] = response
    return response


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze(
    request: AnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnalysisResponse:
    upsert_profile(db, current_user, ProfileUpdate(currency=request.currency, **request.profile.model_dump()))
    analysis = await build_analysis(request.coin, request.profile)

    db.add(
        AnalysisRecord(
            user_id=current_user.id,
            coin_id=request.coin.id,
            coin_symbol=request.coin.symbol,
            score=analysis.score,
            signal=analysis.signal,
            ai_source=analysis.ai_source,
            model=analysis.model,
            payload=analysis.model_dump(mode="json"),
        )
    )
    db.commit()
    return analysis


async def fetch_live_market(currency: Currency) -> list[Coin]:
    params = {
        "vs_currency": currency,
        "ids": ",".join(COINS),
        "order": "market_cap_desc",
        "per_page": "80",
        "page": "1",
        "sparkline": "true",
        "price_change_percentage": "1h,24h,7d,30d",
    }

    async with httpx.AsyncClient(timeout=14) as client:
        response = await client.get("https://api.coingecko.com/api/v3/coins/markets", params=params)
        response.raise_for_status()
        payload = response.json()

    if not isinstance(payload, list) or not payload:
        raise ValueError("CoinGecko returned no market rows")

    return [normalize_coin(row) for row in payload]


def normalize_coin(row: dict) -> Coin:
    current = float(row.get("current_price") or 0)
    sparkline = row.get("sparkline_in_7d", {}).get("price") or []
    coin_id = row.get("id", "")

    return Coin(
        id=coin_id,
        name=row.get("name", ""),
        symbol=str(row.get("symbol", "")).upper(),
        category=ASSET_CATEGORY.get(coin_id, "asset"),
        image=row.get("image") or "",
        current_price=current,
        high_24h=float(row.get("high_24h") or current),
        low_24h=float(row.get("low_24h") or current),
        price_change_percentage_1h=clean_percent(row.get("price_change_percentage_1h_in_currency")),
        price_change_percentage_24h=clean_percent(row.get("price_change_percentage_24h")),
        price_change_percentage_7d=clean_percent(row.get("price_change_percentage_7d_in_currency")),
        price_change_percentage_30d=clean_percent(row.get("price_change_percentage_30d_in_currency")),
        market_cap=float(row.get("market_cap") or 0),
        total_volume=float(row.get("total_volume") or 0),
        market_cap_rank=row.get("market_cap_rank"),
        sparkline=[float(point) for point in sparkline if isinstance(point, int | float)],
    )


def clean_percent(value: object) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0


def build_fallback_market(currency: Currency) -> list[Coin]:
    multiplier = CURRENCY_MULTIPLIERS.get(currency, 1)
    coins: list[Coin] = []

    for index, (coin_id, name, symbol, price, low, high, d1, d7, d30, rank, category) in enumerate(COIN_FALLBACKS):
        current = price * multiplier
        coins.append(
            Coin(
                id=coin_id,
                name=name,
                symbol=symbol,
                category=category,
                image="",
                current_price=current,
                low_24h=low * multiplier,
                high_24h=high * multiplier,
                price_change_percentage_1h=d1 / 8,
                price_change_percentage_24h=d1,
                price_change_percentage_7d=d7,
                price_change_percentage_30d=d30,
                market_cap=current * (19_000_000 - index * 1_100_000),
                total_volume=current * (1_200_000 - index * 70_000),
                market_cap_rank=rank,
                sparkline=make_sparkline(current, d7, index),
            )
        )

    return coins


def make_sparkline(price: float, change: float, seed: int) -> list[float]:
    points: list[float] = []
    start = price / max(0.1, 1 + change / 100)

    for index in range(168):
        progress = index / 167
        wave = sin(index / (8 + seed)) * 0.014 + cos(index / (15 + seed)) * 0.01
        drift = (price - start) * progress
        points.append(max(0.0001, start + drift + price * wave))

    return points


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
        model=os.getenv("OPENAI_MODEL", "gpt-5-mini"),
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


async def maybe_openai_analysis(
    coin: Coin,
    profile: InvestmentProfile,
    base: AnalysisResponse,
) -> dict | None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-5-mini")
    prompt_payload = {
        "coin": coin.model_dump(),
        "profile": profile.model_dump(),
        "rule_analysis": {
            "score": base.score,
            "signal": base.signal,
            "summary": base.summary,
            "allocation": base.allocation,
            "scenarios": [scenario.model_dump() for scenario in base.scenarios],
        },
    }
    prompt = (
        "Return compact JSON only with keys signal, summary, insights. "
        "insights must be an array of 3-4 objects with icon, title, body. "
        "Do not claim certainty. Do not call this financial advice. "
        "Use the supplied market data and investor profile:\n"
        f"{json.dumps(prompt_payload, separators=(',', ':'))}"
    )

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                "https://api.openai.com/v1/responses",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "input": [
                        {
                            "role": "system",
                            "content": (
                                "You are a cautious crypto market analysis assistant. "
                                "You produce educational, risk-aware portfolio notes."
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "max_output_tokens": 700,
                },
            )
            response.raise_for_status()
            text_output = extract_response_text(response.json())
            return parse_json_object(text_output)
    except Exception:
        return None


def extract_response_text(payload: dict) -> str:
    if isinstance(payload.get("output_text"), str):
        return payload["output_text"]

    parts: list[str] = []
    for item in payload.get("output", []):
        for content in item.get("content", []):
            text_value = content.get("text")
            if isinstance(text_value, str):
                parts.append(text_value)
    return "\n".join(parts)


def parse_json_object(text_output: str) -> dict | None:
    if not text_output:
        return None

    cleaned = text_output.strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, re.DOTALL)
    if fenced:
        cleaned = fenced.group(1)

    try:
        parsed = json.loads(cleaned)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if not match:
            return None
        try:
            parsed = json.loads(match.group(0))
            return parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            return None


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


def upsert_profile(db: Session, user: User, payload: ProfileUpdate) -> UserProfile:
    profile = ensure_profile(db, user)
    profile.currency = payload.currency
    profile.investment_amount = payload.investment_amount
    profile.monthly_contribution = payload.monthly_contribution
    profile.holding_coin = payload.holding_coin
    profile.holding_amount = payload.holding_amount
    profile.risk_profile = payload.risk_profile
    profile.strategy_style = payload.strategy_style
    profile.investor_goal = payload.investor_goal
    db.add(profile)
    return profile


def ensure_profile(db: Session, user: User) -> UserProfile:
    if user.profile:
        return user.profile

    profile = UserProfile(user_id=user.id)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def serialize_user(user: User) -> UserOut:
    return UserOut(id=user.id, email=user.email, full_name=user.full_name, theme=user.theme)  # type: ignore[arg-type]


def serialize_profile(profile: UserProfile | None) -> ProfileResponse:
    if profile is None:
        return ProfileResponse()

    return ProfileResponse(
        currency=profile.currency,  # type: ignore[arg-type]
        investment_amount=profile.investment_amount,
        monthly_contribution=profile.monthly_contribution,
        holding_coin=profile.holding_coin,
        holding_amount=profile.holding_amount,
        risk_profile=profile.risk_profile,  # type: ignore[arg-type]
        strategy_style=profile.strategy_style,  # type: ignore[arg-type]
        investor_goal=profile.investor_goal,
        updated_at=profile.updated_at,
    )


def normalize_email(email: str) -> str:
    return email.strip().lower()


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
