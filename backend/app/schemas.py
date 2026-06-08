from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


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
