from fastapi import APIRouter

from app.schemas.common import LoginRequest, SignUpRequest, TokenResponse
from app.services.store import USER_ID

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse)
def signup(payload: SignUpRequest) -> TokenResponse:
    return TokenResponse(access_token=f"demo-token-{payload.email}", user_id=USER_ID)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    return TokenResponse(access_token=f"demo-token-{payload.email}", user_id=USER_ID)


@router.post("/logout")
def logout() -> dict[str, str]:
    return {"message": "Logged out"}
