from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import timedelta


@dataclass(frozen=True)
class Settings:
    app_title: str = "Crypto AI Market Analyst API"
    app_version: str = "1.0.0"
    market_cache_ttl: timedelta = timedelta(seconds=45)
    coingecko_markets_url: str = "https://api.coingecko.com/api/v3/coins/markets"
    openai_responses_url: str = "https://api.openai.com/v1/responses"
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-5-mini")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    cors_origins: tuple[str, ...] = (
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    )


settings = Settings()
