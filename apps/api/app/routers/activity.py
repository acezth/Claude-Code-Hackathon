from fastapi import APIRouter

from app.schemas.common import ActivityEntry, ActivitySummary, ManualWorkoutCreate
from app.services.activity import summarize_activity
from app.services.store import generate_id, integrations, workouts

router = APIRouter(prefix="/activity", tags=["activity"])


@router.get("/", response_model=ActivitySummary)
def get_activity() -> ActivitySummary:
    return summarize_activity(workouts)


@router.post("/manual", response_model=ActivityEntry)
def add_manual_workout(payload: ManualWorkoutCreate) -> ActivityEntry:
    workout = ActivityEntry(id=generate_id(), source="manual", **payload.model_dump())
    workouts.append(workout)
    return workout


@router.post("/strava-sync", response_model=ActivitySummary)
def sync_strava() -> ActivitySummary:
    integrations["strava"].connected = True
    return summarize_activity(workouts)
