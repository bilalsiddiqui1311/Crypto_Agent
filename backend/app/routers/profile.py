from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import ProfileResponse, ProfileUpdate, ThemeUpdate, UserOut
from app.security import get_current_user
from app.services.profile_service import serialize_profile, serialize_user, upsert_profile


router = APIRouter(prefix="/api", tags=["profile"])


@router.put("/profile", response_model=ProfileResponse)
async def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    profile = upsert_profile(db, current_user, payload)
    db.commit()
    db.refresh(profile)
    return serialize_profile(profile)


@router.put("/theme", response_model=UserOut)
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
