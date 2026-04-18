from fastapi import APIRouter

from app.schemas.common import CoachAdviceRequest, CoachAdviceResponse
from app.services.coach import build_daily_advice

router = APIRouter(prefix="/coach", tags=["coach"])


@router.post("/daily-advice", response_model=CoachAdviceResponse)
def daily_advice(payload: CoachAdviceRequest) -> CoachAdviceResponse:
    return build_daily_advice(payload)


@router.post("/meal-advice", response_model=CoachAdviceResponse)
def meal_advice(payload: CoachAdviceRequest) -> CoachAdviceResponse:
    return build_daily_advice(payload)


@router.post("/habit-tip", response_model=CoachAdviceResponse)
def habit_tip(payload: CoachAdviceRequest) -> CoachAdviceResponse:
    return build_daily_advice(payload)
