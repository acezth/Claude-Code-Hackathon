from fastapi import APIRouter

from app.schemas.common import NearbyFoodRequest, NearbyFoodResponse
from app.services.recommendations import build_nearby_recommendations

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.post("/nearby-food", response_model=NearbyFoodResponse)
def get_nearby_food(payload: NearbyFoodRequest) -> NearbyFoodResponse:
    return build_nearby_recommendations(payload)
