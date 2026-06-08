from __future__ import annotations

import json
import re

import httpx

from app.config import settings
from app.schemas import AnalysisResponse, Coin, InvestmentProfile


async def maybe_openai_analysis(
    coin: Coin,
    profile: InvestmentProfile,
    base: AnalysisResponse,
) -> dict | None:
    if not settings.openai_api_key:
        return None

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
                settings.openai_responses_url,
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.openai_model,
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
