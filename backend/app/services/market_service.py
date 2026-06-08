from __future__ import annotations

from datetime import UTC, datetime
from math import cos, sin

import httpx

from app.config import settings
from app.constants import ASSET_CATEGORY, COIN_FALLBACKS, COINS, CURRENCY_MULTIPLIERS
from app.schemas import Coin, Currency, MarketResponse


_market_cache: dict[str, MarketResponse] = {}


async def get_market_response(currency: Currency) -> MarketResponse:
    cached = _market_cache.get(currency)
    now = datetime.now(UTC)
    if cached and now - cached.updated_at < settings.market_cache_ttl:
        return cached

    try:
        coins = await fetch_live_market(currency)
        response = MarketResponse(currency=currency, source="live", updated_at=now, coins=coins)
    except Exception:
        response = MarketResponse(currency=currency, source="fallback", updated_at=now, coins=build_fallback_market(currency))

    _market_cache[currency] = response
    return response


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
        response = await client.get(settings.coingecko_markets_url, params=params)
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
