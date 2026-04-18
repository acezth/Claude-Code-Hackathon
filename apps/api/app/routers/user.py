from fastapi import APIRouter

from app.schemas.common import ProfileUpdate, UserProfile
from app.services.store import user_profile

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/profile", response_model=UserProfile)
def get_profile() -> UserProfile:
    return user_profile


@router.patch("/profile", response_model=UserProfile)
def update_profile(payload: ProfileUpdate) -> UserProfile:
    updates = payload.model_dump(exclude_none=True)
    for key, value in updates.items():
        setattr(user_profile, key, value)
    return user_profile
