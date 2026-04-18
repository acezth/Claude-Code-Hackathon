from fastapi import APIRouter

from app.schemas.common import FridgeScanRequest, FridgeScanResponse
from app.services.fridge import analyze_fridge

router = APIRouter(prefix="/fridge", tags=["fridge"])


@router.post("/analyze", response_model=FridgeScanResponse)
def analyze(payload: FridgeScanRequest) -> FridgeScanResponse:
    return analyze_fridge(payload)
