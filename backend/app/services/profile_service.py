from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import User, UserProfile
from app.schemas import ProfileResponse, ProfileUpdate, UserOut


def ensure_profile(db: Session, user: User) -> UserProfile:
    if user.profile:
        return user.profile

    profile = UserProfile(user_id=user.id)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


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
