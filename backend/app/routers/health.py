from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import text

from app.database import SessionLocal


router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health() -> dict[str, str]:
    with SessionLocal() as db:
        db.execute(text("SELECT 1"))
    return {"status": "ok", "service": "crypto-ai-market-api", "database": "ok"}
