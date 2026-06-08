from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AnalysisRecord, User
from app.schemas import AnalysisRequest, AnalysisResponse, ProfileUpdate
from app.security import get_current_user
from app.services.analysis_service import build_analysis
from app.services.profile_service import upsert_profile


router = APIRouter(prefix="/api", tags=["analysis"])


@router.post("/analyze", response_model=AnalysisResponse)
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
