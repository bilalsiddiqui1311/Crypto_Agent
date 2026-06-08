from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import AuthResponse, LoginRequest, SessionResponse, SignupRequest
from app.security import create_access_token, get_current_user
from app.services.profile_service import ensure_profile, serialize_profile, serialize_user
from app.services.user_service import authenticate_user, create_user


router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = create_user(db, payload)
    return AuthResponse(token=create_access_token(user), user=serialize_user(user), profile=serialize_profile(user.profile))


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = authenticate_user(db, payload)
    profile = ensure_profile(db, user)
    return AuthResponse(token=create_access_token(user), user=serialize_user(user), profile=serialize_profile(profile))


@router.get("/me", response_model=SessionResponse)
async def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> SessionResponse:
    profile = ensure_profile(db, current_user)
    return SessionResponse(user=serialize_user(current_user), profile=serialize_profile(profile))
