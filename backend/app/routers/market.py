from __future__ import annotations

from fastapi import APIRouter

from app.schemas import Currency, MarketResponse
from app.services.market_service import get_market_response


router = APIRouter(prefix="/api", tags=["market"])


@router.get("/market", response_model=MarketResponse)
async def get_market(currency: Currency = "usd") -> MarketResponse:
    return await get_market_response(currency)
